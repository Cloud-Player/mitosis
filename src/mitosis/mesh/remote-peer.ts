import {IConnection} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {WebSocketConnection} from '../connection/websocket';
import {Address} from '../message/address';
import {Protocol} from '../message/interface';
import {RoleType} from '../role/interface';
import {RoutingTable} from './routing-table';

export class RemotePeer {
  private _id: string;
  private _routingTable: RoutingTable;
  private _roleTypes: Array<RoleType>;
  private _connections: Array<IConnection>;
  private _publicKey: string;

  public constructor(routingTable: RoutingTable) {
    this._routingTable = routingTable;
    this._roleTypes = [RoleType.PEER];
    this._connections = [];
  }

  public getId(): string {
    return this._id;
  }

  public getPublicKey(): string {
    return this._publicKey;
  }

  public getBestConnection(): IConnection {
    return this._connections.sort((a, b) => a.getQuality() - b.getQuality()).shift();
  }

  public hasRole(roleType: RoleType): boolean {
    return this._roleTypes.indexOf(roleType) >= 0;
  }

  public connect(address: Address): Promise<IConnection> {
    let connection: IConnection;
    switch (address.getProtocol()) {
      case Protocol.WEBSOCKET:
        connection = new WebSocketConnection(address);
        break;
      case Protocol.WEBRTC:
        connection = new WebRTCConnection(address);
        break;
    }
    this._connections.push(connection);
    return connection.open();
  }

  public send(message: any): void {
    return this.getBestConnection().send(message);
  }
}
