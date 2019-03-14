import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {IClock} from '../clock/interface';
import {Configuration, ConfigurationMap} from '../configuration';
import {
  ConnectionState,
  IConnection,
  IConnectionChurnEvent,
  IConnectionOptions,
  IViaConnectionOptions,
  IWebRTCConnectionOptions,
  Protocol
} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {ConnectionNegotiation, ConnectionNegotiationType} from '../message/connection-negotiation';
import {IMessage, MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {PeerSuggestion} from '../message/peer-suggestion';
import {PeerUpdate} from '../message/peer-update';
import {RouterAlive} from '../message/router-alive';
import {UnknownPeer} from '../message/unknown-peer';
import {ViaConnectionMeter} from '../metering/connection-meter/via-connection-meter';
import {RoleType} from '../role/interface';
import {RoleManager} from '../role/role-manager';
import {IPeerChurnEvent} from './interface';
import {RemotePeer} from './remote-peer';
import {RemotePeerTable} from './remote-peer-table';

export class PeerManager {

  private readonly _myId: string;
  private _roleManager: RoleManager;
  private _acquisitionBoost: number;
  private _clock: IClock;
  private _peers: Array<RemotePeer>;
  private _peerChurnSubject: Subject<IPeerChurnEvent>;
  private _peerConnectionChurnSubject: Subject<IConnectionChurnEvent>;

  constructor(myId: string, roleManager: RoleManager, clock: IClock) {
    this._myId = myId;
    this._roleManager = roleManager;
    this._acquisitionBoost = 0;
    this._clock = clock;
    this._peers = [];
    this._peerChurnSubject = new Subject();
    this._peerConnectionChurnSubject = new Subject();
  }

  private onConnectionRemoved(connection: IConnection, remotePeer: RemotePeer): void {
    if (remotePeer.getConnectionTable().length === 0) {
      // Remove the peer entirely if no connections are left
      this.removePeer(remotePeer);
      this.sendUnknownPeerToDirectPeers(remotePeer.getId());
    }
    if (remotePeer.getConnectionTable().filterDirectData().length === 0) {
      // Remove all via connections that went over this peer
      this.getPeerTable()
        .forEach(
          peer => peer
            .getConnectionTable()
            .filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI)
            .filterByLocation(remotePeer.getId())
            .forEach(
              viaConnection => {
                Logger.getLogger(this._myId).warn('close via connection because parent connection was closed', viaConnection);
                viaConnection.close();
              }
            )
        );
    }
    this._peerConnectionChurnSubject.next({connection: connection, type: ChurnType.REMOVED});
  }

  private onConnectionAdded(connection: IConnection, remotePeer: RemotePeer): void {
    this._peerConnectionChurnSubject.next({connection: connection, type: ChurnType.ADDED});
  }

  private getConfiguration(): Configuration {
    return this._roleManager.getConfiguration();
  }

  private broadcastAllowed(message: IMessage): boolean {
    switch (message.getSubject()) {
      case MessageSubject.ROUTER_ALIVE:
        return !this._roleManager.hasRole(RoleType.SIGNAL);
      default:
        return false;
    }
  }

  private sendUnknownPeerToDirectPeers(unknownPeerId: string) {
    this.getPeerTable()
      .filterConnections(
        table => table
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
      )
      .forEach(peer => {
          this.sendMessageToPeer(
            peer,
            new UnknownPeer(
              new Address(this.getMyId()),
              new Address(peer.getId()),
              unknownPeerId
            )
          );
        }
      );
    Logger.getLogger(this.getMyId()).warn(`tell direct peers that peer ${unknownPeerId} does not exist anymore`);
  }

  private broadcast(message: IMessage): void {
    if (this.broadcastAllowed(message)) {
      let forwardPeers = this.getPeerTable()
        .filterConnections(
          table => table
            .filterDirectData()
            .filterByStates(ConnectionState.OPEN)
        );
      if (message.getInboundAddress()) {
        forwardPeers = forwardPeers.exclude(
          table => table.filterById(message.getInboundAddress().getId())
        );
      }
      forwardPeers
        .forEach(
          peer => this.sendMessageToPeer(peer, message)
        );
    } else {
      Logger.getLogger(this.getMyId()).warn(
        `${message.getSubject()} is not allowed to be broadcast`
      );
    }
  }

  private updateViaPeer(remotePeer: RemotePeer, viaPeerId: string, quality?: number) {
    remotePeer
      .getConnectionTable()
      .filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI)
      .filterByLocation(viaPeerId)
      .forEach((connection) => {
        const meter: ViaConnectionMeter = connection.getMeter() as ViaConnectionMeter;
        meter.updateLastSeen();
        if (quality) {
          meter.setQuality(quality);
        }
      });
  }

  /*
   * Returns either:
   * - the given remote peer when it has at least on direct connection
   * - a direct peer that is a via peer of the peer in question
   * - a direct peer that knows the router in case no remotePeer exist in peer table
   */
  private resolvePeer(remotePeer: RemotePeer): RemotePeer {
    if (!remotePeer) {
      if (!this._roleManager.hasRole(RoleType.ROUTER)) {
        const router = this.getPeerTable().filterByRole(RoleType.ROUTER).pop();
        if (router) {
          return this.resolvePeer(router);
        }
      }
      return;
    }
    const hasDirectConnections = this.getPeerTable()
      .filterById(remotePeer.getId())
      .countConnections(
        connectionTable =>
          connectionTable.filterDirectData().filterByStates(ConnectionState.OPEN)
      ) > 0;
    if (hasDirectConnections) {
      return remotePeer;
    } else if (remotePeer) {
      let bestViaConnector: IConnection;
      const viaPeers = remotePeer
        .getConnectionTable()
        .filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI);
      if (remotePeer.hasRole(RoleType.ROUTER)) {
        bestViaConnector = viaPeers
          .sortBy(
            connection =>
              (connection.getMeter() as ViaConnectionMeter).getRouterLinkQuality(this.getPeerTable())
          )
          .pop();
      } else {
        bestViaConnector = viaPeers
          .sortByQuality(this.getPeerTable())
          .pop();
      }
      if (bestViaConnector) {
        return this.getPeerById(bestViaConnector.getAddress().getLocation());
      }
    }
  }

  private sendMessageToPeer(peer: RemotePeer, message: IMessage) {
    const connection: IConnection = peer.getConnectionTable()
      .filterByStates(ConnectionState.OPEN)
      .filterDirectData()
      .sortByQuality(this.getPeerTable())
      .pop();
    if (connection) {
      try {
        connection.send(message);
        Logger.getLogger(this.getMyId())
          .debug(`sending ${message.getSubject()} to ${connection.getAddress().getId()}`, message);
        return true;
      } catch (error) {
        Logger.getLogger(this.getMyId())
          .error(`cannot send ${message.getSubject()} to ${connection.getAddress().getId()}`, error);
        connection.close();
        return false;
      }
    } else {
      Logger.getLogger(this.getMyId())
        .error(`sending failed because no connection to ${peer.getId()}`, message, peer);
      return false;
    }
  }

  public getMyId(): string {
    return this._myId;
  }

  public connectTo(address: Address, options?: IConnectionOptions): Promise<RemotePeer> {
    let peer = this.getPeerById(address.getId());

    if (peer && peer.getConnectionForAddress(address)) {
      return Promise.resolve(peer);
    }

    const directPeers = this.getPeerTable()
      .filterConnections(
        table => table.filterDirect()
      );
    const isViaAddress = address.isProtocol(Protocol.VIA, Protocol.VIA_MULTI);
    if (!isViaAddress && directPeers.length >= this.getConfiguration().DIRECT_CONNECTIONS_MAX) {
      const rejectReason = `rejecting ${address.getId()} because max connections reached`;
      Logger.getLogger(this.getMyId())
        .error(rejectReason);
      return Promise.reject(rejectReason);
    }

    if (!peer) {
      peer = new RemotePeer(address.getId(), this._myId, this._clock.fork());

      peer.observeChurn()
        .pipe(
          filter(ev => ev.type === ChurnType.REMOVED)
        )
        .subscribe(
          ev => this.onConnectionRemoved(ev.connection, peer)
        );

      peer.observeChurn()
        .pipe(
          filter(ev => ev.type === ChurnType.ADDED)
        )
        .subscribe(
          ev => this.onConnectionAdded(ev.connection, peer)
        );

      this._peers.push(peer);

      this._peerChurnSubject.next({peer: peer, type: ChurnType.ADDED});
    }

    return peer.connect(address, options)
      .then(() => {
        return peer;
      })
      .catch(reason => {
        Logger.getLogger(this._myId)
          .warn(`cannot open connection to ${address.getId()}`, reason);
        return Promise.reject(reason);
      });
  }

  public connectToVia(remoteAddress: Address, options?: IConnectionOptions): Promise<RemotePeer> {
    const viaPeer = this.getPeerById(remoteAddress.getLocation());
    if (viaPeer) {
      const parent = viaPeer
        .getConnectionTable()
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
        .shift();
      if (!parent) {
        const reason = `cannot connect to ${remoteAddress.getId()} because parent has no open direct connection`;
        Logger.getLogger(this._myId).error(reason);
        return Promise.reject(reason);
      }
      options = options || {payload: {}};
      options.payload.quality = parent.getMeter().getQuality(this.getPeerTable());
      options.payload.parent = parent;
      return this.connectTo(remoteAddress, options as IViaConnectionOptions);
    } else {
      const reason = `cannot connect to ${remoteAddress.getId()} because via ${remoteAddress.getLocation()} is missing`;
      Logger.getLogger(this._myId).error(reason);
      return Promise.reject(reason);
    }
  }

  public ensureConnection(remoteAddress: Address, options?: IConnectionOptions): Promise<RemotePeer> {
    const existingRemotePeer = this.getPeerById(remoteAddress.getId());

    if (!existingRemotePeer) {
      if (remoteAddress.getId() === remoteAddress.getLocation()) {
        return Promise.reject(
          `direct connection to ${remoteAddress.getId()} disappeared`);
      } else {
        return this.connectToVia(remoteAddress, options);
      }
    }

    if (existingRemotePeer.getId() === this._myId) {
      // remote peer is me
      return Promise.reject('will not connect to myself');
    }

    if (!existingRemotePeer.getConnectionForAddress(remoteAddress)) {
      return this.connectToVia(remoteAddress, options);
    } else {
      if (remoteAddress.isProtocol(Protocol.VIA, Protocol.VIA_MULTI)) {
        // Update ViaConnection properties like lastSeen. This must only happen for via connection not for direct
        let quality;
        if (options && options.payload.quality) {
          quality = options.payload.quality;
        }
        this.updateViaPeer(existingRemotePeer, remoteAddress.getLocation(), quality);
        Logger.getLogger(this._myId)
          .debug(`update ${remoteAddress.getProtocol()} connection ${existingRemotePeer.getId()}`, existingRemotePeer);
      }
      return Promise.resolve(existingRemotePeer);
    }
  }

  public getAcquisitionBoost(): number {
    return this._acquisitionBoost;
  }

  public activateAcquisitionBoost(): void {
    this._acquisitionBoost = this.getConfiguration().DIRECT_CONNECTION_BOOST_AMOUNT;
    this._clock.setTimeout(
      () => {
        this._acquisitionBoost = 0;
      },
      this.getConfiguration().DIRECT_CONNECTION_BOOST_TIMEOUT
    );
  }

  public sendPeerUpdate(receiverId: string): void {
    const directPeers = this
      .getPeerTable()
      .filterByRole(RoleType.PEER)
      .filterConnections(
        table => table
          .filterDirectData()
          .filterByStates(ConnectionState.OPEN)
      );

    const peerUpdate = new PeerUpdate(
      new Address(this.getMyId()),
      new Address(receiverId),
      directPeers,
      this.getPeerTable()
    );
    this.sendMessage(peerUpdate);
  }

  public sendPeerSuggestion(receiverId: string): void {
    const directPeers = this
      .getPeerTable()
      .filterByRole(RoleType.PEER)
      .filterConnections(
        table => table
          .filterDirectData()
          .filterByStates(ConnectionState.OPEN)
      );

    const peerUpdate = new PeerSuggestion(
      new Address(this.getMyId()),
      new Address(receiverId),
      directPeers,
      this.getPeerTable()
    );
    this.sendMessage(peerUpdate);
  }

  public handleRouterAlive(aliveMessage: RouterAlive, isFirstAliveForSequence: boolean) {
    const aliveSequence = aliveMessage.getBody().sequence;
    const inBoundPeer = this.getPeerById(aliveMessage.getInboundAddress().getId());
    const directPeers = this.getPeerTable()
      .filterConnections(
        connectionTable => connectionTable.filterDirectData()
      );
    if (isFirstAliveForSequence) {
      const routerPeer = this.getPeerById(aliveMessage.getSender().getId());
      if (routerPeer) {
        routerPeer.setRoles([RoleType.PEER, RoleType.ROUTER]);
      }
      directPeers.forEach(
        peer => peer.getMeter().getRouterAliveHighScore().addSequence(aliveSequence)
      );
      inBoundPeer
        .getMeter()
        .getRouterAliveHighScore()
        .setRankForSequence(aliveSequence, 1);
    } else {
      const directPeersThatHaveAlreadyReceivedAliveSequence = directPeers
        .filter(
          peer => peer
            .getMeter()
            .getRouterAliveHighScore()
            .hasReceivedSequence(aliveSequence)
        );
      inBoundPeer
        .getMeter()
        .getRouterAliveHighScore()
        .setRankForSequence(aliveSequence, directPeersThatHaveAlreadyReceivedAliveSequence.length + 1);
    }
  }

  public updateSuggestedPeers(peerSuggestion: PeerSuggestion, viaPeerId: string) {
    const senderId = peerSuggestion.getSender().getId();

    const updatedPeerIds: Array<string> = [];

    peerSuggestion
      .getBody()
      .filter(
        entry => entry.peerId !== this._myId
      )
      .forEach(
        entry => {
          updatedPeerIds.push(entry.peerId);
          const peerExistedBefore = !!this.getPeerById(entry.peerId);
          this.ensureConnection(
            new Address(entry.peerId, Protocol.VIA_MULTI, viaPeerId))
            .then(
              remotePeer => {
                // TODO: Only set roles if peerUpdate from superior
                if (!peerExistedBefore) {
                  remotePeer.setRoles(entry.roles);
                }
              }
            ).catch(
            reason => Logger.getLogger(this.getMyId()).debug(reason)
          );
        }
      );

    this.getPeerTable()
      .forEach(
        peer => peer
          .getConnectionTable()
          .filterByProtocol(Protocol.VIA)
          .filterByLocation(senderId)
          .filter(
            connection =>
              updatedPeerIds.indexOf(connection.getAddress().getId()) === -1
          )
          .forEach(
            connection => connection.close()
          )
      );
  }

  public updatePeers(peerUpdate: PeerUpdate, viaPeerId: string): void {
    const senderId = peerUpdate.getSender().getId();

    const updatedPeerIds: Array<string> = [];

    if (senderId !== viaPeerId) {
      Logger.getLogger(this.getMyId())
        .error(`will not accept peer-update from ${senderId} via ${viaPeerId}`, peerUpdate);
      return;
    }

    peerUpdate
      .getBody()
      .filter(
        entry => entry.peerId !== this._myId
      )
      .forEach(
        entry => {
          updatedPeerIds.push(entry.peerId);
          const peerExistedBefore = !!this.getPeerById(entry.peerId);
          this.ensureConnection(
            new Address(entry.peerId, Protocol.VIA, senderId),
            {payload: {quality: entry.quality}}
          )
            .then(
              remotePeer => {
                // TODO: Only set roles if peerUpdate from superior
                remotePeer.setRoles(entry.roles);
              }
            ).catch(
            reason => Logger.getLogger(this.getMyId()).debug(reason)
          );
        }
      );

    this.getPeerTable()
      .forEach(
        peer => peer
          .getConnectionTable()
          .filterByProtocol(Protocol.VIA)
          .filterByLocation(senderId)
          .filter(
            connection =>
              updatedPeerIds.indexOf(connection.getAddress().getId()) === -1
          )
          .forEach(
            connection => connection.close()
          )
      );
  }

  public negotiateConnection(connectionNegotiation: ConnectionNegotiation): void {
    const logger = Logger.getLogger(this._myId);
    const senderAddress = connectionNegotiation.getSender();
    const receiverAddress = connectionNegotiation.getReceiver();
    const negotiation = connectionNegotiation.getBody();

    const directConnectionCount = this.getPeerTable()
      .countConnections(
        table => table.filterDirect()
      );

    if (directConnectionCount >= this.getConfiguration().DIRECT_CONNECTIONS_MAX &&
      negotiation.type === ConnectionNegotiationType.OFFER
    ) {
      logger.info('too many connections already', connectionNegotiation);
      const rejection = new Message(
        receiverAddress,
        senderAddress,
        MessageSubject.CONNECTION_NEGOTIATION,
        {type: ConnectionNegotiationType.REJECTION}
      );
      this.sendMessage(rejection);
      return;
    }

    const options: IWebRTCConnectionOptions = {
      mitosisId: this._myId,
      payload: {
        type: negotiation.type,
        sdp: negotiation.sdp
      }
    };
    switch (negotiation.type) {
      case ConnectionNegotiationType.OFFER:
        this.connectTo(senderAddress, options)
          .catch(
            error =>
              logger.warn(`${senderAddress.getProtocol()} offer connection to ${senderAddress} failed`, error)
          );
        break;
      case ConnectionNegotiationType.ANSWER:
        this.connectTo(senderAddress).then(
          remotePeer => {
            const webRTCConnection: WebRTCConnection =
              remotePeer.getConnectionForAddress(senderAddress) as WebRTCConnection;
            if (webRTCConnection) {
              webRTCConnection.establish(options);
            } else {
              logger.error(`${senderAddress.getProtocol()} connection ${senderAddress.getLocation()} not found`, connectionNegotiation);
            }
          }
        ).catch(
          error =>
            logger.warn(`${senderAddress.getProtocol()} answer connection to ${senderAddress} failed`, error)
        );
        break;
      case ConnectionNegotiationType.REJECTION:
        this.getPeerById(senderAddress.getId())
          .getConnectionTable()
          .filterByProtocol(Protocol.WEBRTC_DATA)
          .filterByStates(ConnectionState.OPENING)
          .forEach(
            connection => {
              logger.warn(`${senderAddress.getProtocol()} connection negotiation rejected by ${senderAddress}`, connection);
              connection.close();
            }
          );
        break;
      default:
        throw new Error(
          `unsupported ${senderAddress.getProtocol()} connection negotiation type ${negotiation.type}`
        );
    }
  }

  public sendMessage(message: IMessage): boolean {
    if (message.getTtl() < 1) {
      Logger.getLogger(this._myId)
        .warn(`message ${message.getId()} from ${message.getSender().getId()} timed out`, message);
      return false;
    } else {
      message.decreaseTtl();
    }
    if (message.getReceiver().getId() === ConfigurationMap.getDefault().BROADCAST_ADDRESS) {
      this.broadcast(message);
      return;
    }
    let existingPeer;
    const protocol = message.getReceiver().getProtocol();
    if (!protocol) {
      existingPeer = this.resolvePeer(this.getPeerById(message.getReceiver().getId()));
    } else if (protocol === Protocol.VIA || protocol === Protocol.VIA_MULTI) {
      existingPeer = this.getPeerById(message.getReceiver().getLocation());
    } else {
      existingPeer = this.getPeerById(message.getReceiver().getId());
    }
    if (existingPeer) {
      return this.sendMessageToPeer(existingPeer, message);
    } else {
      Logger.getLogger(this._myId)
        .warn(`failed to send message to ${message.getReceiver().getId()}`, message);
      return false;
    }
  }

  public getPeerTable(): RemotePeerTable {
    return new RemotePeerTable(this._peers);
  }

  public getPeerById(id: string): RemotePeer {
    return this._peers.find(p => p.getId() === id);
  }

  public removePeer(remotePeer: RemotePeer): void {
    const index = this._peers.indexOf(remotePeer);
    if (index > -1) {
      this._peers.splice(index, 1);
    }
    this._peerChurnSubject.next({peer: remotePeer, type: ChurnType.REMOVED});
    remotePeer.destroy();
  }

  public observePeerChurn(): Subject<IPeerChurnEvent> {
    return this._peerChurnSubject;
  }

  public observePeerConnectionChurn(): Subject<IConnectionChurnEvent> {
    return this._peerConnectionChurnSubject;
  }

  public toString(): string {
    return JSON.stringify({
        count: this._peers.length,
        remotePeers: this._peers
      },
      undefined,
      2
    );
  }

  public destroy(): void {
    this._peerChurnSubject.complete();
    this._peers.forEach(remotePeer => this.removePeer(remotePeer));
    this._clock.stop();
  }
}
