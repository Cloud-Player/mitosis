import {Subject} from 'rxjs';
import {ConnectionTable} from '../connection/connection-table';
import {ConnectionState, IConnection, IConnectionOptions, ProtocolConnectionMap} from '../connection/interface';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {RoleType} from '../role/interface';
import {ChurnType} from './interface';

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

  public getConnectionTable(): ConnectionTable {
    return ConnectionTable.fromIterable(
      this._connectionsPerAddress.values()
    );
  }

  public getConnectionForAddress(address: Address): IConnection {
    return this._connectionsPerAddress.get(address.toString());
  }

  private openConnection(connection: IConnection): Promise<RemotePeer> {
    const openPromise = this._openConnectionPromises.get(connection);
    let promise;
    if (!openPromise) {
      if (connection.getState() === ConnectionState.OPEN) {
        return Promise.resolve(this);
      }
      promise = new Promise<RemotePeer>((resolve) => {
        connection.open().then(() => {
          resolve(this);
          this._openConnectionPromises.delete(connection);
        });
      });
      this._openConnectionPromises.set(connection, promise);
    } else {
      promise = openPromise;
    }
    return promise;
  }

  private createConnection(address: Address, options?: IConnectionOptions): IConnection {
    if (!options) {
      options = {
        protocol: address.getProtocol(),
        mitosisId: this._mitosisId
      };
    }
    const connectionClass = ProtocolConnectionMap.get(address.getProtocol());
    if (!connectionClass) {
      throw new Error(`unsupported protocol ${address.getProtocol()}`);
    }
    return new connectionClass(address, options);
  }

  public hasRole(roleType: RoleType): boolean {
    return this._roleTypes.indexOf(roleType) >= 0;
  }

  public connect(address: Address, options?: IConnectionOptions): Promise<RemotePeer> {
    let connection = this._connectionsPerAddress.get(address.toString());
    if (!connection) {
      connection = this.createConnection(address, options);
      this._connectionsPerAddress.set(address.toString(), connection);
      console.log('connection added', connection.getAddress().toString());
      this._connectionChurnSubject.next({connection: connection, type: ChurnType.ADDED});
    }
    return this.openConnection(connection);
  }

  public send(message: Message): void {
    const connection: IConnection = this.getConnectionTable()
      .filterByStates(ConnectionState.OPEN)
      .filterDirect()
      .sortByQuality()
      .shift();
    if (connection) {
      connection.send(message);
    } else {
      throw new Error(`no direct connection to ${message.getReceiver()}`);
    }
  }

  public observeChurn(): Subject<IConnectionChurnEvent> {
    return this._connectionChurnSubject;
  }
}
