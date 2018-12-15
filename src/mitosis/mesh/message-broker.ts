import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {
  ConnectionState,
  IConnection,
  IWebRTCConnectionOptions,
  WebRTCConnectionOptionsPayloadType
} from '../connection/interface';
import {ViaConnection} from '../connection/via';
import {WebRTCConnection} from '../connection/webrtc';
import {Address} from '../message/address';
import {ConnectionNegotiation, ConnectionNegotiationType} from '../message/connection-negotiation';
import {MessageSubject, Protocol} from '../message/interface';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {RoleUpdate} from '../message/role-update';
import {RoleType} from '../role/interface';
import {RemotePeer} from './remote-peer';
import {RoleManager} from './role-manager';
import {ChurnType, RoutingTable} from './routing-table';

export class MessageBroker {

  private _routingTable: RoutingTable;
  private _roleManager: RoleManager;
  private _roleUpdateSubject: Subject<Array<RoleType>>;
  private _redirectsSubject: Subject<Message>;

  constructor(routingTable: RoutingTable, roleManager: RoleManager) {
    this._routingTable = routingTable;
    this.listenOnRoutingTablePeerChurn();
    this._roleManager = roleManager;
    this._roleUpdateSubject = new Subject();
    this._redirectsSubject = new Subject();
  }

  private listenOnRoutingTablePeerChurn(): void {
    console.log('listen on table churn');
    this._routingTable.observePeerChurn()
      .pipe(
        filter(ev => ev.type === ChurnType.ADDED)
      )
      .subscribe(
        ev => this.listenOnConnectionChurn(ev.peer)
      );
  }

  private listenOnConnectionChurn(remotePeer: RemotePeer): void {
    console.log('peer added', remotePeer);
    remotePeer.observeChurn()
      .pipe(
        filter(ev => ev.type === ChurnType.ADDED)
      )
      .subscribe(
        ev => this.listenOnConnectionAdded(ev.connection)
      );
  }

  private listenOnConnectionAdded(connection: IConnection): void {
    console.log('connection added', connection);
    connection.observeMessageReceived()
      .subscribe(
        message => {
          this.ensureViaConnection(message.getSender(), connection.getAddress());
          this.handleMessage(message);
        }
      );
  }

  private ensureViaConnection(sender: Address, lastHop: Address): void {
    console.log('ensuring via connection', sender, lastHop);
    if (
      !lastHop.matches(sender) &&
      sender.getId() !== this._routingTable.getMyId()
    ) {
      const viaAddress = new Address(
        sender.getId(),
        Protocol.VIA,
        lastHop.getId()
      );
      this._routingTable.connectTo(viaAddress);
    }
  }

  private handleMessage(message: Message): void {
    console.log('handling message', message);
    if (message.getReceiver().getId() === this._routingTable.getMyId()) {
      this.receiveMessage(message);
    } else {
      this.forwardMessage(message);
    }
  }

  private receiveMessage(message: Message): void {
    switch (message.getSubject()) {
      case MessageSubject.ROLE_UPDATE:
        this.updateRoles(message as RoleUpdate);
        break;
      case MessageSubject.PEER_UPDATE:
        this.updatePeers(message as PeerUpdate);
        break;
      case MessageSubject.CONNECTION_NEGOTIATION:
        this.negotiateConnection(message as ConnectionNegotiation);
        break;
      default:
        throw new Error(`unsupported subject ${message.getSubject()}`);
    }
  }

  private updateRoles(roleUpdate: RoleUpdate): void {
    this._roleManager.updateRoles(roleUpdate.getBody());
  }

  private updatePeers(peerUpdate: PeerUpdate): void {
    peerUpdate.getBody().forEach(
      entry => {
        const address = new Address(
          entry.peerId,
          Protocol.VIA,
          peerUpdate.getSender().getId()
        );
        this._routingTable.connectTo(address);
      }
    );
  }

  private negotiateConnection(connectionNegotiation: ConnectionNegotiation): void {
    const senderAddress = connectionNegotiation.getSender();
    const options: IWebRTCConnectionOptions = {
      protocol: Protocol.WEBRTC,
      mitosisId: this._routingTable.getMyId(),
      payload: {
        type: connectionNegotiation.getBody().type as unknown as WebRTCConnectionOptionsPayloadType,
        sdp: connectionNegotiation.getBody().sdp
      }
    };
    switch (connectionNegotiation.getBody().type) {
      case ConnectionNegotiationType.OFFER:
        this._routingTable.connectTo(senderAddress, options);
        break;
      case ConnectionNegotiationType.ANSWER:
        this._routingTable.connectTo(senderAddress).then(remotePeer => {
          const webRTCConnecton: WebRTCConnection =
            remotePeer.getConnectionForAddress(senderAddress) as WebRTCConnection;
          webRTCConnecton.establish(options.payload);
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
    const receiverPeer = this._routingTable.getPeerById(peerId);
    const connection = receiverPeer.getConnectionTable()
      .filterByStates(ConnectionState.OPEN)
      .sortByQuality()
      .shift();
    let directPeer;
    if (connection instanceof ViaConnection) {
      const directPeerId = connection.getAddress().getLocation();
      directPeer = this._routingTable.getPeerById(directPeerId);
    } else {
      directPeer = receiverPeer;
    }
    directPeer.send(message);
  }

  public observeRoleUpdate(): Subject<Array<RoleType>> {
    return this._roleUpdateSubject;
  }

  public observeRedirects(): Subject<Message> {
    return this._redirectsSubject;
  }
}
