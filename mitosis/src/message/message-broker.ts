import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ConnectionState, IConnection, Protocol} from '../connection/interface';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {PeerManager} from '../peer/peer-manager';
import {RemotePeer} from '../peer/remote-peer';
import {RoleManager} from '../role/role-manager';
import {ConnectionNegotiation} from './connection-negotiation';
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

  private handleMessage(message: Message, connection: IConnection): void {
    try {
      this._incomingMessageSubject.next(message);
      if (message.getReceiver().getId() === this._peerManager.getMyId()) {
        this.receiveMessage(message, connection);
      } else {
        this.forwardMessage(message);
      }
    } catch (error) {
      Logger.getLogger(message.getReceiver().getId()).error(error.message, error);
      throw error;
    }
  }

  private receiveMessage(message: Message, connection: IConnection): void {
    const viaPeerId = connection.getAddress().getId();
    const senderId = message.getSender().getId();

    this._peerManager
      .ensureConnection(senderId, viaPeerId)
      .catch(
        reason =>
          Logger.getLogger(this._peerManager.getMyId()).warn(reason, message)
      );

    switch (message.getSubject()) {
      case MessageSubject.ROLE_UPDATE:
        this._roleManager.updateRoles(message as RoleUpdate);
        break;
      case MessageSubject.PEER_UPDATE:
        this._peerManager.updatePeers(message as PeerUpdate, viaPeerId);
        break;
      case MessageSubject.CONNECTION_NEGOTIATION:
        this._peerManager.negotiateConnection(message as ConnectionNegotiation);
        break;
      case MessageSubject.APP_CONTENT:
        this._appContentMessagesSubject.next(message);
        break;
      case MessageSubject.INTRODUCTION:
        // Do nothing, role manager will forward this to signal role if needed
        break;
      default:
        throw new Error(`unsupported subject ${message.getSubject()}`);
    }
    this._messagesSubject.next(message);
  }

  private forwardMessage(message: Message): void {
    const peerId = message.getReceiver().getId();
    const receiverPeer = this._peerManager.getPeerById(peerId);
    if (!receiverPeer) {
      Logger.getLogger(this._peerManager.getMyId()).error(`no idea how to reach ${peerId}`, message);
      return;
    }
    const connection = receiverPeer.getConnectionTable()
      .filterByStates(ConnectionState.OPEN)
      .sortByQuality()
      .shift();
    let directPeer;
    if (!connection) {
      Logger.getLogger(this._peerManager.getMyId()).error(`all connections lost to ${peerId}`, message);
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
