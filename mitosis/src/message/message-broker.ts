import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ConfigurationMap} from '../configuration';
import {IConnection, Protocol} from '../connection/interface';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {PeerManager} from '../peer/peer-manager';
import {RemotePeer} from '../peer/remote-peer';
import {RoleType} from '../role/interface';
import {RoleManager} from '../role/role-manager';
import {StreamManager} from '../stream/stream-manager';
import {Address} from './address';
import {ChannelAnnouncement} from './channel-announcement';
import {ConnectionNegotiation} from './connection-negotiation';
import {FloodingHandler} from './flooding-handler';
import {IMessage, MessageSubject} from './interface';
import {PeerSuggestion} from './peer-suggestion';
import {PeerUpdate} from './peer-update';
import {RoleUpdate} from './role-update';
import {RouterAlive} from './router-alive';
import {UnknownPeer} from './unknown-peer';

export class MessageBroker {

  private _peerManager: PeerManager;
  private _roleManager: RoleManager;
  private _streamManager: StreamManager;
  private _appContentMessagesSubject: Subject<IMessage>;
  private _messagesSubject: Subject<IMessage>;
  private _incomingMessageSubject: Subject<IMessage>;
  private _routerAliveFloodingHandler: FloodingHandler;

  constructor(peerManager: PeerManager, roleManager: RoleManager, streamManager: StreamManager) {
    this._peerManager = peerManager;
    this.listenOnPeerChurn();
    this._roleManager = roleManager;
    this._streamManager = streamManager;
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

      const viaPeerId = message.getInboundAddress().getId();
      const senderId = message.getSender().getId();

      Logger.getLogger(this._peerManager.getMyId()).warn(`ensure connection to ${senderId} via ${viaPeerId}`);
      this._peerManager
        .ensureConnection(new Address(senderId, Protocol.VIA_MULTI, viaPeerId))
        .catch(
          reason =>
            Logger.getLogger(this._peerManager.getMyId()).warn(reason, message)
        );

      if (message.getReceiver().getId() === this._peerManager.getMyId()) {
        this.receiveMessage(message);
      } else if (message.getReceiver().getId() === ConfigurationMap.getDefault().BROADCAST_ADDRESS) {
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

    switch (message.getSubject()) {
      case MessageSubject.ROLE_UPDATE:
        this._roleManager.updateRoles(message as RoleUpdate);
        break;
      case MessageSubject.PEER_UPDATE:
        this._peerManager.updatePeers(message as PeerUpdate, viaPeerId);
        break;
      case MessageSubject.PEER_SUGGESTION:
        this._peerManager.updateSuggestedPeers(message as PeerSuggestion, viaPeerId);
        break;
      case MessageSubject.UNKNOWN_PEER:
        const existingPeer = this._peerManager.getPeerById(message.getBody());
        if (existingPeer) {
          existingPeer
            .getConnectionTable()
            .filterByLocation(message.getInboundAddress().getId())
            .forEach(connection => connection.close());
        }
        break;
      case MessageSubject.CONNECTION_NEGOTIATION:
        switch (message.getSender().getProtocol()) {
          case Protocol.WEBRTC_STREAM:
            this._streamManager.negotiateConnection(message as ConnectionNegotiation);
            break;
          default:
            this._peerManager.negotiateConnection(message as ConnectionNegotiation);
            break;
        }
        break;
      case MessageSubject.APP_CONTENT:
        this._appContentMessagesSubject.next(message);
        break;
      case MessageSubject.INTRODUCTION:
        // Do nothing, role manager will forward this to signal role if needed
        break;
      case MessageSubject.ROUTER_ALIVE:
        const aliveMessage: RouterAlive = message as RouterAlive;
        const firstAliveForSequence = this._routerAliveFloodingHandler.isFirstMessage(aliveMessage);
        this._peerManager.handleRouterAlive(aliveMessage, firstAliveForSequence);
        break;
      case MessageSubject.PEER_ALIVE:
        if (!this._roleManager.hasRole(RoleType.ROUTER)) {
          Logger.getLogger(this._peerManager.getMyId()).warn(`i am not a router`, message);
        }
        break;
      case MessageSubject.CHANNEL_ANNOUNCEMENT:
        this._streamManager.updateProviders((message as ChannelAnnouncement).getBody());
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
      const inboundAddress = message.getInboundAddress();
      Logger.getLogger(this._peerManager.getMyId())
        .debug(`telling ${inboundAddress.getId()} that i don't know ${peerId}`, message);
      this._peerManager.sendMessage(
        new UnknownPeer(message.getReceiver(), message.getInboundAddress(), peerId)
      );
    }
    this._peerManager.sendMessage(message);
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
