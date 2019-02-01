import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ConnectionState, IConnection, Protocol} from '../connection/interface';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {PeerManager} from '../peer/peer-manager';
import {RemotePeer} from '../peer/remote-peer';
import {RoleManager} from '../role/role-manager';
import {ConnectionNegotiation} from './connection-negotiation';
import {IMessage, MessageSubject} from './interface';
import {PeerUpdate} from './peer-update';
import {RoleUpdate} from './role-update';
import {FloodingHandler} from './flooding-handler';
import {Configuration} from '../configuration';

export class MessageBroker {

  private _peerManager: PeerManager;
  private _roleManager: RoleManager;
  private _appContentMessagesSubject: Subject<IMessage>;
  private _messagesSubject: Subject<IMessage>;
  private _incomingMessageSubject: Subject<IMessage>;
  private _routerAliveFloodingHandler: FloodingHandler;

  constructor(peerManager: PeerManager, roleManager: RoleManager) {
    this._peerManager = peerManager;
    this.listenOnPeerChurn();
    this._roleManager = roleManager;
    this._appContentMessagesSubject = new Subject();
    this._messagesSubject = new Subject();
    this._incomingMessageSubject = new Subject();
    this._routerAliveFloodingHandler = new FloodingHandler(peerManager);
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

  private handleMessage(message: IMessage, connection: IConnection): void {
    try {
      message.setInboundAddress(connection.getAddress());
      this._incomingMessageSubject.next(message);
      if (message.getReceiver().getId() === this._peerManager.getMyId()) {
        this.receiveMessage(message);
      } else if (message.getReceiver().getId() === Configuration.BROADCAST_ADDRESS) {
        this.receiveMessage(message);
        this.broadcastMessage(message);
      } else {
        this.forwardMessage(message);
      }
    } catch (error) {
      Logger.getLogger(message.getReceiver().getId()).error(error.message, error);
      throw error;
    }
  }

  private receiveMessage(message: IMessage): void {
    const viaPeerId = message.getInboundAddress().getId();
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
      case MessageSubject.ROUTER_ALIVE:
        if (this._routerAliveFloodingHandler.isFirstMessage(message)) {
          // TODO handle router alive message
          Logger.getLogger(this._peerManager.getMyId())
            .warn(
              `got alive message from router via ${message.getInboundAddress().getId()}`,
              message.getInboundAddress(),
              message
            );
        }
        break;
      default:
        throw new Error(`unsupported subject ${message.getSubject()}`);
    }
    this._messagesSubject.next(message);
  }

  private broadcastMessage(message: IMessage): void {
    switch (message.getSubject()) {
      case MessageSubject.ROUTER_ALIVE:
        this._routerAliveFloodingHandler.floodMessage(message);
        break;
      default:
        throw new Error(`message from type ${message.getSubject()} can not be broadcasted`);
    }
  }

  private forwardMessage(message: IMessage): void {
    const peerId = message.getReceiver().getId();
    const receiverPeer = this._peerManager.getPeerById(peerId);
    if (!receiverPeer) {
      Logger.getLogger(this._peerManager.getMyId()).debug(`no idea how to reach ${peerId}`, message);
      this._peerManager.sendPeerUpdate(message.getInboundAddress());
      return;
    }
    const connection = receiverPeer.getConnectionTable()
      .filterByStates(ConnectionState.OPEN)
      .sortByQuality()
      .shift();
    if (!connection) {
      Logger.getLogger(this._peerManager.getMyId()).error(`all connections lost to ${peerId}`, message);
      return;
    }
    if (connection.getAddress().getProtocol() === Protocol.VIA) {
      const directPeerId = connection.getAddress().getLocation();
      const directPeer = this._peerManager.getPeerById(directPeerId);
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
