import {Subject} from 'rxjs';
import {IConnection, IConnectionOptions, IWebRTCConnectionOptions} from '../connection/interface';
import {ViaConnection} from '../connection/via';
import {WebRTCConnection} from '../connection/webrtc';
import {WebSocketConnection} from '../connection/websocket';
import {Address} from '../message/address';
import {Protocol} from '../message/interface';
import {RoleType} from '../role/interface';
import {ChurnType} from './routing-table';

export interface IConnectionChurnEvent {
  type: ChurnType;
  connection: IConnection;
}

export class RemotePeer {
  private _id: string;
  private _mitosisId: string;
  private _publicKey: string;
  private _roleTypes: Array<RoleType>;
  private _connectionsPerAddress: Map<string, IConnection>;
  private _openConnectionPromises: Map<IConnection, Promise<RemotePeer>>;
  private _connectionChurnSubject: Subject<IConnectionChurnEvent>;

  public constructor(id: string, mitosisId: string) {
    this._id = id;
    this._mitosisId = mitosisId;
    this._roleTypes = [RoleType.PEER];
    this._connectionsPerAddress = new Map();
    this._openConnectionPromises = new Map();
    this._connectionChurnSubject = new Subject();
  }

  public getId(): string {
    return this._id;
  }

  public getRoles(): Array<RoleType> {
    return this._roleTypes;
  }

  public getPublicKey(): string {
    return this._publicKey;
  }

  public getConnectionForAddress(address: Address): IConnection {
    return this._connectionsPerAddress.get(address.toString());
  }

  private getSortedConnections(): Array<IConnection> {
    return Array.from(this._connectionsPerAddress.values())
      .filter(connection => connection.isOpen())
      .sort((a, b) => a.getQuality() - b.getQuality());
  }

  private getBestDirectConnection(): IConnection {
    return this.getSortedConnections()
      .filter(connection => !(connection instanceof ViaConnection))
      .shift();
  }

  private openConnection(connection: IConnection): Promise<RemotePeer> {
    const openPromise = this._openConnectionPromises.get(connection);
    let promise;
    if (!openPromise) {
      promise = new Promise<RemotePeer>((resolve) => {
        connection.open().then(() => {
          resolve(this);
          this._openConnectionPromises.delete(connection);
        });
      });
      this._openConnectionPromises.set(connection, promise);
      console.warn('CONNECTING TO', connection.getAddress().toString())

    } else {
      console.warn('CONNECTION TO', connection.getAddress().toString(), 'IS TRYING TO OPEN')
      promise = openPromise;
    }
    return promise;
  }

  private createConnection(address: Address, options?: IConnectionOptions): IConnection {
    let connection;
    switch (address.getProtocol()) {
      case Protocol.WEBSOCKET:
      case Protocol.WEBSOCKET_UNSECURE:
        connection = new WebSocketConnection(address);
        break;
      case Protocol.WEBRTC:
        let webRtcOptions = options as IWebRTCConnectionOptions;
        if (!webRtcOptions) {
          webRtcOptions = {
            protocol: Protocol.WEBRTC,
            mitosisId: this._mitosisId
          };
        }
        connection = new WebRTCConnection(address, webRtcOptions);
        break;
      case Protocol.VIA:
        connection = new ViaConnection(address);
        break;
      default:
        throw new Error(`unsupported protocol ${address.getProtocol()}`);
    }
    return connection;
  }

  public hasDirectConnection(): boolean {
    return !!this.getBestDirectConnection();
  }

  public getBestConnection(): IConnection {
    return this.getSortedConnections()
      .shift();
  }

  public hasRole(roleType: RoleType): boolean {
    return this._roleTypes.indexOf(roleType) >= 0;
  }

  public connect(address: Address, options?: IConnectionOptions): Promise<RemotePeer> {
    let existingConnection = this._connectionsPerAddress.get(address.toString());
    if (!existingConnection) {
      existingConnection = this.createConnection(address, options);
      this._connectionsPerAddress.set(address.toString(), existingConnection);
      console.log('remote peer creates new connection', existingConnection);
      this._connectionChurnSubject.next({connection: existingConnection, type: ChurnType.ADDED});
    }
    if (existingConnection.isOpen()) {
      return Promise.resolve(this);
    }
    return this.openConnection(existingConnection);
  }

  public send(message: any): void {
    return this.getBestDirectConnection().send(message);
  }

  public observeChurn(): Subject<IConnectionChurnEvent> {
    return this._connectionChurnSubject;
  }
}
