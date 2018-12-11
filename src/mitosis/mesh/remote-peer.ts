import {Address} from '../address/address';
import {Protocol} from '../address/interface';
import {IConnection} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {WebSocketConnection} from '../connection/websocket';
import {RoleType} from '../role/interface';
import {RoutingTable} from './routing-table';

export class RemotePeer {
  private _id: number;
  private _manager: RoutingTable;
  private _roleTypes: Array<RoleType>;
  private _connections: Array<IConnection>;
  private _publicKey: string;

  public constructor(manager: RoutingTable) {
    this._manager = manager;
    this._roleTypes = [RoleType.PEER];
    this._connections = [];
  }

  public getId(): number {
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
    if (address.getProtocol() === Protocol.WEBSOCKET) {
      connection = new WebSocketConnection(address);
    } else {
      connection = new WebRTCConnection(address);
    }
    this._connections.push(connection);
    return connection.open();
  }

  public send(message: any): void {
    return this.getBestConnection().send(message);
  }
}
