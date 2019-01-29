import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {
  ConnectionState,
  IConnection,
  IConnectionOptions,
  IWebRTCConnectionOptions,
  Protocol,
  WebRTCConnectionOptionsPayloadType
} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {PeerManager} from '../peer/peer-manager';
import {RemotePeer} from '../peer/remote-peer';
import {RoleManager} from '../role/role-manager';
import {ConnectionNegotiation, ConnectionNegotiationType} from './connection-negotiation';
import {MessageSubject} from './interface';
import {Message} from './message';
import {PeerUpdate} from './peer-update';
import {RoleUpdate} from './role-update';

export class MessageBroker {

  private _peerManager: PeerManager;
  private _roleManager: RoleManager;
  private _appContentMessagesSubject: Subject<Message>;
  private _messagesSubject: Subject<Message>;
  private _incomingMessageSubject: Subject<Message>;

  constructor(peerManager: PeerManager, roleManager: RoleManager) {
    this._peerManager = peerManager;
    this.listenOnPeerChurn();
    this._roleManager = roleManager;
    this._appContentMessagesSubject = new Subject();
    this._messagesSubject = new Subject();
    this._incomingMessageSubject = new Subject();
  }

  private listenOnPeerChurn(): void {
    this._peerManager.observePeerChurn()
      .pipe(
        filter(ev => ev.type === ChurnType.ADDED)
      )
      .subscribe(
        ev => this.listenOnConnectionChurn(ev.peer)
      );
  }

  private listenOnConnectionChurn(remotePeer: RemotePeer): void {
    Logger.getLogger(this._peerManager.getMyId()).info(`added ${remotePeer.getId()}`);
    remotePeer.observeChurn()
      .pipe(
        filter(ev => ev.type === ChurnType.ADDED)
      )
      .subscribe(
        ev => this.listenOnConnectionAdded(ev.connection)
      );
  }

  private listenOnConnectionAdded(connection: IConnection): void {
    connection.observeMessageReceived()
      .subscribe(
        message => {
          this.handleMessage(message, connection);
        }
      );
  }

  private ensureViaConnection(remotePeerId: string, viaPeerId: string, quality: number = 1): Promise<RemotePeer> {
    if (
      remotePeerId !== viaPeerId &&
      remotePeerId !== this._peerManager.getMyId()
    ) {
      const options: IConnectionOptions = {
        payload: {quality: quality}
      };
      return this._peerManager.connectToVia(remotePeerId, viaPeerId, options);
    }
    return Promise.reject('via connection not ensured');
  }

  private handleMessage(message: Message, connection: IConnection): void {
    this._incomingMessageSubject.next(message);
    if (message.getReceiver().getId() === this._peerManager.getMyId()) {
      this.receiveMessage(message, connection);
    } else {
      this.forwardMessage(message);
    }
  }

  private receiveMessage(message: Message, connection: IConnection): void {
    this.ensureViaConnection(
      message.getSender().getId(),
      connection.getAddress().getId()
    ).catch(
      reason => Logger.getLogger(this._peerManager.getMyId()).debug(reason)
    );
    switch (message.getSubject()) {
      case MessageSubject.ROLE_UPDATE:
        // TODO: Only accept role update from superior
        this.updateRoles(message as RoleUpdate);
        break;
      case MessageSubject.PEER_UPDATE:
        this.updatePeers(message as PeerUpdate, connection);
        break;
      case MessageSubject.CONNECTION_NEGOTIATION:
        this.negotiateConnection(message as ConnectionNegotiation);
        break;
      case MessageSubject.APP_CONTENT:
        this._appContentMessagesSubject.next(message);
        break;
      case MessageSubject.INTRODUCTION:
        break;
      default:
        throw new Error(`unsupported subject ${message.getSubject()}`);
    }
    this._messagesSubject.next(message);
  }

  private updateRoles(roleUpdate: RoleUpdate): void {
    this._roleManager.updateRoles(roleUpdate.getBody());
  }

  private updatePeers(peerUpdate: PeerUpdate, connection: IConnection): void {
    // Only accept peer updates from direct connections or peers in opening state
    if (peerUpdate.getSender().getId() !== connection.getAddress().getId()) {
      const sender = this._peerManager.getPeerById(peerUpdate.getSender().getId());
      const openingConnections = sender.getConnectionTable()
        .filterDirect()
        .filterByStates(ConnectionState.OPENING);
      if (openingConnections.length === 0) {
        throw new Error(
          `${peerUpdate.getReceiver()} will not accept peer update from ` +
          `${peerUpdate.getSender()} via ${connection.getAddress()}`
        );
      }
    }
    peerUpdate.getBody()
      .forEach(
        entry => {
          this.ensureViaConnection(
            entry.peerId,
            peerUpdate.getSender().getId(),
            entry.quality
          ).then(
            remotePeer => {
              // TODO: Only set roles if roleUpdate from superior
              remotePeer.setRoles(entry.roles);
            }
          ).catch(
            reason => Logger.getLogger(this._peerManager.getMyId()).debug(reason)
          );
        }
      );
  }

  private negotiateConnection(connectionNegotiation: ConnectionNegotiation): void {
    const senderAddress = connectionNegotiation.getSender();
    const options: IWebRTCConnectionOptions = {
      mitosisId: this._peerManager.getMyId(),
      payload: {
        type: connectionNegotiation.getBody().type as unknown as WebRTCConnectionOptionsPayloadType,
        sdp: connectionNegotiation.getBody().sdp
      }
    };
    switch (connectionNegotiation.getBody().type) {
      case ConnectionNegotiationType.OFFER:
        this._peerManager.connectTo(senderAddress, options);
        break;
      case ConnectionNegotiationType.ANSWER:
        this._peerManager.connectTo(senderAddress).then(remotePeer => {
          const webRTCConnection: WebRTCConnection =
            remotePeer.getConnectionForAddress(senderAddress) as WebRTCConnection;
          webRTCConnection.establish(options.payload);
        });
        break;
      default:
        throw new Error(
          `unsupported connection negotiation type ${connectionNegotiation.getType()}`
        );
    }
  }

  private forwardMessage(message: Message): void {
    const peerId = message.getReceiver().getId();
    const receiverPeer = this._peerManager.getPeerById(peerId);
    if (!receiverPeer) {
      Logger.getLogger(this._peerManager.getMyId()).error(`no idea how to reach ${peerId}`);
      return;
    }
    const connection = receiverPeer.getConnectionTable()
      .filterByStates(ConnectionState.OPEN)
      .sortByQuality()
      .shift();
    let directPeer;
    if (!connection) {
      Logger.getLogger(this._peerManager.getMyId()).error(`all connections lost to ${peerId}`);
      return;
    }
    if (connection.getAddress().getProtocol() === Protocol.VIA) {
      const directPeerId = connection.getAddress().getLocation();
      directPeer = this._peerManager.getPeerById(directPeerId);
      directPeer.send(message);
    } else {
      receiverPeer.send(message);
    }
  }

  public observeAppContentMessages() {
    return this._appContentMessagesSubject;
  }

  public observeMessages() {
    return this._messagesSubject;
  }

  public observeIncomingMessages() {
    return this._incomingMessageSubject;
  }

  public destroy() {
    this._appContentMessagesSubject.complete();
    this._messagesSubject.complete();
    this._incomingMessageSubject.complete();
  }
}
