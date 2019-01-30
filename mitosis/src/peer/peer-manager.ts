import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {IClock} from '../clock/interface';
import {Configuration} from '../configuration';
import {
  IConnectionOptions,
  IViaConnectionOptions,
  IWebRTCConnectionOptions,
  Protocol,
  WebRTCConnectionOptionsPayloadType
} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {ConnectionNegotiation, ConnectionNegotiationType} from '../message/connection-negotiation';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
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

  constructor(myId: string, roleManager: RoleManager, clock: IClock) {
    this._myId = myId;
    this._roleManager = roleManager;
    this._clock = clock;
    this._peers = [];
    this._peerChurnSubject = new Subject();
  }

  private listenOnConnectionRemoved(remotePeer: RemotePeer): void {
    if (remotePeer.getConnectionTable().length === 0) {
      // Remove the peer entirely if no connections are left
      this.removePeer(remotePeer);
    }
    if (remotePeer.getConnectionTable().filterDirect().length === 0) {
      // Remove all via connections that went over this peer
      this.getPeerTable()
        .asArray()
        .forEach(
          peer => peer
            .getConnectionTable()
            .filterVia(remotePeer.getId())
            .asArray()
            .forEach(
              viaConnection => viaConnection.close()
            )
        );
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
      .filterConnection(
        table => table.filterDirect()
      );
    if (directPeers.length >= Configuration.DIRECT_CONNECTIONS_MAX) {
      return Promise.reject(`max direct connections reached ${address.toString()}`);
    }

    if (!peer) {
      peer = new RemotePeer(address.getId(), this._myId, this._clock.fork());
      this._peers.push(peer);
      peer.observeChurn()
        .pipe(
          filter(ev => ev.type === ChurnType.REMOVED)
        )
        .subscribe(() => this.listenOnConnectionRemoved(peer)
        );
      this._peerChurnSubject.next({peer: peer, type: ChurnType.ADDED});
    }

    return peer.connect(address, options)
      .then(() => {
        return peer;
      })
      .catch(reason => {
        Logger.getLogger(this._myId)
          .warn(`cannot open connection to ${address.toString()}`, reason);
        return Promise.reject(reason);
      });
  }

  public connectToVia(remotePeerId: string, viaPeerId: string, options?: IConnectionOptions): Promise<RemotePeer> {
    const viaPeer = this.getPeerById(viaPeerId);
    if (viaPeer) {
      const address = new Address(
        remotePeerId,
        Protocol.VIA,
        viaPeerId
      );
      options = options || {payload: {}};
      options.payload.quality = options.payload.quality || 1;
      options.payload.parent = viaPeer
        .getConnectionTable()
        .filterDirect()
        .shift();
      return this.connectTo(address, options as IViaConnectionOptions);
    } else {
      const reason = `cannot connect to ${remotePeerId} because via ${viaPeerId} is missing`;
      Logger.getLogger(this._myId).error(reason);
      return Promise.reject(reason);
    }
  }

  public ensureConnection(remotePeerId: string, viaPeerId: string, options?: IConnectionOptions): Promise<RemotePeer> {
    if (remotePeerId === viaPeerId) {
      const remotePeer = this.getPeerById(remotePeerId);
      if (remotePeer) {
        return Promise.resolve(remotePeer);
      } else {
        return Promise.reject(
          `direct connection to ${remotePeerId} disappeared`);
      }
    } else if (remotePeerId === this._myId) {
      return Promise.reject('will not connect to myself');
    } else {
      return this.connectToVia(remotePeerId, viaPeerId, options);
    }
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
      .forEach(
        entry => {
          updatedPeerIds.push(entry.peerId);
          this.ensureConnection(
            entry.peerId,
            senderId,
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
      .asArray()
      .forEach(
        peer => peer
          .getConnectionTable()
          .filterVia(senderId)
          .filterConnection(
            connection =>
              updatedPeerIds.indexOf(connection.getAddress().getId()) === -1
          )
          .asArray()
          .forEach(
            connection => connection.close()
          )
      );
  }

  public negotiateConnection(connectionNegotiation: ConnectionNegotiation) {
    const senderAddress = connectionNegotiation.getSender();
    const options: IWebRTCConnectionOptions = {
      mitosisId: this._myId,
      payload: {
        type: connectionNegotiation.getBody().type as unknown as WebRTCConnectionOptionsPayloadType,
        sdp: connectionNegotiation.getBody().sdp
      }
    };
    switch (connectionNegotiation.getBody().type) {
      case ConnectionNegotiationType.OFFER:
        this.connectTo(senderAddress, options);
        break;
      case ConnectionNegotiationType.ANSWER:
        this.connectTo(senderAddress).then(
          remotePeer => {
            const webRTCConnection: WebRTCConnection =
              remotePeer.getConnectionForAddress(senderAddress) as WebRTCConnection;
            webRTCConnection.establish(options.payload);
          }
        );
        break;
      default:
        throw new Error(
          `unsupported connection negotiation type ${connectionNegotiation.getType()}`
        );
    }
  }

  public sendMessage(message: Message) {
    const existingPeer = this.getPeerById(message.getReceiver().getId());
    if (existingPeer) {
      existingPeer.send(message);
    } else {
      Logger.getLogger(this._myId)
        .error(`cannot send message because ${message.getReceiver().toString()} has left`);
    }
  }

  public getPeerTable(): RemotePeerTable {
    return new RemotePeerTable(this._peers);
  }

  public getPeerById(id: string): RemotePeer {
    return this._peers.find(p => p.getId() === id);
  }

  public removePeer(remotePeer: RemotePeer): boolean {
    const rolesRequiringPeer = this._roleManager.getRolesRequiringPeer(remotePeer);
    Logger.getLogger(this._myId)
      .info(`${remotePeer.getId()} is required by ${rolesRequiringPeer.join(' and ') || 'nobody'}`);
    if (rolesRequiringPeer.length === 0) {
      const index = this._peers.indexOf(remotePeer);
      if (index > -1) {
        this._peers.splice(index, 1);
        this._peerChurnSubject.next({peer: remotePeer, type: ChurnType.REMOVED});
        remotePeer.destroy();
        return true;
      }
    }
    return false;
  }

  public observePeerChurn(): Subject<IPeerChurnEvent> {
    return this._peerChurnSubject;
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
