import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {ConnectionTable} from '../connection/connection-table';
import {ConnectionState, IConnection, IConnectionChurnEvent, IConnectionOptions, Protocol} from '../connection/interface';
import {ProtocolConnectionMap} from '../connection/protocol-map';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {IMessage} from '../message/interface';
import {RemotePeerMeter} from '../metering/remote-peer-meter';
import {RoleType} from '../role/interface';
import {ObservableMap} from '../util/observable-map';
import {RemotePeerTable} from './remote-peer-table';

export class RemotePeer {

  private _id: string;
  private _clock: IClock;
  private _meter: RemotePeerMeter;
  private _mitosisId: string;
  private _publicKey: string;
  private _roleTypes: Array<RoleType>;
  private readonly _connectionsPerAddress: ObservableMap<string, IConnection>;
  private readonly _openConnectionPromises: Map<IConnection, Promise<RemotePeer>>;
  private readonly _connectionChurnSubject: Subject<IConnectionChurnEvent>;

  public constructor(id: string, mitosisId: string, clock: IClock) {
    this._id = id;
    this._mitosisId = mitosisId;
    this._clock = clock;
    this._roleTypes = [RoleType.PEER];
    this._connectionsPerAddress = new ObservableMap();
    this._openConnectionPromises = new Map();
    this._connectionChurnSubject = new Subject();
    this._meter = new RemotePeerMeter(this._connectionsPerAddress, this._id, clock.fork());
  }

  private listenOnConnectionChanges(connection: IConnection): void {
    connection.observeStateChange().subscribe((ev) => {
      switch (ev) {
        case ConnectionState.CLOSED:
          this.cleanUpRouterForLastDirect(connection.getAddress());
          this._connectionsPerAddress.delete(connection.getAddress().toString());
          this._connectionChurnSubject.next({connection: connection, type: ChurnType.REMOVED});
          break;
      }
      Logger.getLogger(this._mitosisId)
        .debug(`${connection.getAddress().getProtocol()} connection to ${connection.getAddress().getId()} ${ev.toString()}`, connection);
    });
  }

  private cleanUpRouterForLastDirect(address: Address) {
    if (address.isProtocol(Protocol.WEBRTC_DATA)) {
      const hasDirectConenctions = this.getConnectionTable().filterDirectData().length > 0;
      if (!hasDirectConenctions) {
        this.getMeter().getRouterAliveHighScore().reset();
      }
    }
  }

  private openConnection(connection: IConnection): Promise<RemotePeer> {
    let promise = this._openConnectionPromises.get(connection);
    if (!promise) {
      switch (connection.getState()) {
        case ConnectionState.OPEN:
          promise = Promise.resolve(this);
          break;
        case ConnectionState.CLOSING:
        case ConnectionState.ERROR:
          promise = Promise.reject(`will not connect to connection in ${connection.getState()}`);
          break;
        case ConnectionState.CLOSED:
          promise = new Promise<RemotePeer>((resolve, reject) => {
            connection.open()
              .then(() => {
                resolve(this);
              })
              .catch((reason: any) => {
                reject(reason);
              })
              .finally(() => {
                this._openConnectionPromises.delete(connection);
              });
          });
          this._openConnectionPromises.set(connection, promise);
          break;
        default:
          throw new Error('opening connection should be in map');
      }
    }
    return promise;
  }

  private createConnection(address: Address, options?: IConnectionOptions): IConnection {
    options = options || {};
    options.mitosisId = options.mitosisId || this._mitosisId;

    const connectionClass = ProtocolConnectionMap.get(address.getProtocol());
    if (!connectionClass) {
      throw new Error(`unsupported protocol ${address.getProtocol()}`);
    }
    const connection = new connectionClass(address, this._clock.fork(), options);
    this._connectionsPerAddress.set(address.toString(), connection);
    this._connectionChurnSubject.next({connection: connection, type: ChurnType.ADDED});
    this.listenOnConnectionChanges(connection);
    return connection;
  }

  public getId(): string {
    return this._id;
  }

  public getRoles(): Array<RoleType> {
    return this._roleTypes;
  }

  public setRoles(roleTypes: Array<RoleType>): void {
    this._roleTypes = roleTypes;
  }

  public getPublicKey(): string {
    return this._publicKey;
  }

  public getConnectionTable(): ConnectionTable {
    return ConnectionTable.fromIterable(
      this._connectionsPerAddress.values()
    );
  }

  public getMeter(): RemotePeerMeter {
    return this._meter;
  }

  public getQuality(remotePeers: RemotePeerTable): number {
    return this._meter.getQuality(remotePeers);
  }

  public getConnectionForAddress(address: Address): IConnection {
    return this._connectionsPerAddress.get(address.toString());
  }

  public hasRole(...roleTypes: Array<RoleType>): boolean {
    return this._roleTypes
      .filter(roleType => roleTypes.indexOf(roleType) >= 0)
      .length > 0;
  }

  public connect(address: Address, options?: IConnectionOptions): Promise<RemotePeer> {
    let connection = this._connectionsPerAddress.get(address.toString());
    if (!connection) {
      connection = this.createConnection(address, options);
    }
    return this.openConnection(connection).catch(
      reason => {
        Logger.getLogger(this._mitosisId)
          .error(`can not open connection to ${address.getId()}`, reason);
        return Promise.reject(reason);
      }
    );
  }

  public send(message: IMessage): boolean {
    const connection: IConnection = this.getConnectionTable()
      .filterByStates(ConnectionState.OPEN)
      .filterByProtocol(
        Protocol.WEBSOCKET,
        Protocol.WEBSOCKET_UNSECURE,
        Protocol.WEBRTC_DATA
      )
      .sortByQuality()
      .pop();
    if (connection) {
      try {
        connection.send(message);
        Logger.getLogger(this._mitosisId)
          .debug(`sending ${message.getSubject()} to ${connection.getAddress().getId()}`, message);
        return true;
      } catch (error) {
        Logger.getLogger(this._mitosisId)
          .error(`cannot send ${message.getSubject()} to ${connection.getAddress().getId()}`, error);
        connection.close();
        return false;
      }
    } else {
      Logger.getLogger(this._mitosisId)
        .error(`no direct connection to ${message.getReceiver().getId()} says ${this.getId()}`, message);
      return false;
    }
  }

  public observeChurn(): Subject<IConnectionChurnEvent> {
    return this._connectionChurnSubject;
  }

  public toString(): string {
    return JSON.stringify({
        id: this._id,
        roles: this._roleTypes,
        connections: this._connectionsPerAddress.keysAsList()
      },
      undefined,
      2
    );
  }

  public destroy(): void {
    this._meter.stop();
    this._connectionsPerAddress.forEach(
      connection => connection.close()
    );
    this.observeChurn().subscribe(
      () => {
        if (this._connectionsPerAddress.size === 0) {
          this._connectionChurnSubject.complete();
        }
      }
    );
    this._clock.stop();
  }
}
