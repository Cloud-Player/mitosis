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
  IWebRTCStreamConnectionOptions,
  NegotiationState,
  Protocol
} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {WebRTCStreamConnection} from '../connection/webrtc-stream';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {ConnectionNegotiation, ConnectionNegotiationType} from '../message/connection-negotiation';
import {IMessage, MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
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
  private _clock: IClock;
  private _peers: Array<RemotePeer>;
  private _peerChurnSubject: Subject<IPeerChurnEvent>;
  private _peerConnectionChurnSubject: Subject<IConnectionChurnEvent>;

  constructor(myId: string, roleManager: RoleManager, clock: IClock) {
    this._myId = myId;
    this._roleManager = roleManager;
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
    if (remotePeer.getConnectionTable().filterDirect().length === 0) {
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

  private listenOnConnectionAdded(connection: IConnection, remotePeer: RemotePeer): void {
    if (remotePeer.getConnectionTable().length === 0) {
      // Remove the peer entirely if no connections are left
      this.removePeer(remotePeer);
      this.sendUnknownPeerToDirectPeers(remotePeer.getId());
    }
    if (remotePeer.getConnectionTable().filterDirect().length === 0) {
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
          peer
            .send(new UnknownPeer(new Address(this.getMyId()), new Address(peer.getId()), unknownPeerId));
        }
      );
    Logger.getLogger(this.getMyId()).warn(`tell direct peers that peer ${unknownPeerId} does not exist anymore`);
  }

  private broadcast(message: IMessage): void {
    if (this.broadcastAllowed(message)) {
      let forwardPeers = this.getPeerTable()
        .filterConnections(
          table => table
            .filterDirect()
            .filterByStates(ConnectionState.OPEN)
        );
      if (message.getInboundAddress()) {
        forwardPeers = forwardPeers.exclude(
          table => table.filterById(message.getInboundAddress().getId())
        );
      }
      forwardPeers
        .forEach(
          peer => peer.send(message)
        );
    } else {
      Logger.getLogger(this.getMyId()).warn(
        `${message.getSubject()} is not allowed to be broadcast`
      );
    }
  }

  private updateViaPeer(remotePeer: RemotePeer, viaPeerId: string) {
    remotePeer
      .getConnectionTable()
      .filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI)
      .filterByLocation(viaPeerId)
      .forEach((connection) => {
        const meter: ViaConnectionMeter = connection.getMeter() as ViaConnectionMeter;
        meter.updateLastSeen();
      });
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
    if (directPeers.length >= this.getConfiguration().DIRECT_CONNECTIONS_MAX) {
      return Promise.reject(`rejecting ${address.getId()} because max connections reached`);
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
      options = options || {payload: {}};
      options.payload.quality = options.payload.quality || 1;
      options.payload.parent = viaPeer
        .getConnectionTable()
        .filterDirect()
        .shift();
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
        // Update ViaConnection properties like lastSeen. This must only happen for via connction not for direct
        this.updateViaPeer(existingRemotePeer, remoteAddress.getLocation());
        Logger.getLogger(this._myId)
          .debug(`update ${remoteAddress.getProtocol()} connection ${existingRemotePeer.getId()}`, existingRemotePeer);
      }
      return Promise.resolve(existingRemotePeer);
    }
  }

  public sendPeerUpdate(receiverAddress: Address): void {
    const directPeers = this
      .getPeerTable()
      .filterByRole(RoleType.PEER)
      .filterConnections(
        table => table
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
      );

    const myAddress = new Address(
      this.getMyId(),
      receiverAddress.getProtocol(),
      receiverAddress.getLocation()
    );

    const peerUpdate = new PeerUpdate(
      myAddress,
      receiverAddress,
      directPeers
    );
    this.sendMessage(peerUpdate);
  }

  public updatePeers(peerUpdate: PeerUpdate, viaPeerId: string): void {
    const senderId = peerUpdate.getSender().getId();
    const sender = this.getPeerById(senderId);

    if (senderId !== viaPeerId) {
      throw new Error(
        `will not accept peer update from ${senderId} via ${viaPeerId}`
      );
    }

    const updatedPeerIds: Array<string> = [];

    peerUpdate
      .getBody()
      .filter(
        entry => entry.peerId !== this._myId
      )
      .forEach(
        entry => {
          updatedPeerIds.push(entry.peerId);
          this.ensureConnection(
            new Address(entry.peerId, Protocol.VIA, senderId),
            {payload: {quality: 0.5}}
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
        {type: ConnectionNegotiationType.REJECT}
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
      case ConnectionNegotiationType.REJECT:
        this.getPeerById(senderAddress.getId())
          .getConnectionTable()
          .filterByLocation(receiverAddress.getLocation())
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

  public sendMessage(message: IMessage) {
    if (message.getReceiver().getId() === ConfigurationMap.getDefault().BROADCAST_ADDRESS) {
      this.broadcast(message);
      return;
    }
    let existingPeer;
    const protocol = message.getReceiver().getProtocol();
    const breadCrumbs = [];
    if (!protocol) {
      const receiver = this.getPeerById(message.getReceiver().getId());
      if (receiver) {
        const connection = receiver.getConnectionTable()
          .filterByStates(ConnectionState.OPEN)
          .sortByQuality()
          .pop();
        breadCrumbs.push('No protocol was set');
        if (connection) {
          if (connection.getAddress().getProtocol() === Protocol.VIA ||
            connection.getAddress().getProtocol() === Protocol.VIA_MULTI) {
            existingPeer = this.getPeerById(connection.getAddress().getLocation());
            breadCrumbs.push('Select VIA', connection.getAddress().getLocation());
          } else {
            existingPeer = this.getPeerById(message.getReceiver().getId());
            breadCrumbs.push('Select DIRECT', connection.getAddress().getId());
          }
        }
      }
    } else if (protocol === Protocol.VIA || protocol === Protocol.VIA_MULTI) {
      existingPeer = this.getPeerById(message.getReceiver().getLocation());
      breadCrumbs.push('Select VIA', message.getReceiver().getLocation());
    } else {
      existingPeer = this.getPeerById(message.getReceiver().getId());
      breadCrumbs.push('Select DIRECT', message.getReceiver().getLocation());

    }
    if (existingPeer) {
      existingPeer.send(message);
    } else {
      Logger.getLogger(this._myId)
        .error(`failed to send message to ${message.getReceiver()}`, breadCrumbs, message);
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
