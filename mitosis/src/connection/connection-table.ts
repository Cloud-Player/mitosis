import {ConnectionState, IConnection, Protocol} from './interface';

export class ConnectionTable {

  private _connections: Array<IConnection>;

  public constructor(connections: Array<IConnection>) {
    this._connections = connections.slice();
  }

  public static fromIterable(iterable: IterableIterator<IConnection>): ConnectionTable {
    return new ConnectionTable(Array.from(iterable));
  }

  public filterByStates(...states: Array<ConnectionState>): ConnectionTable {
    return new ConnectionTable(
      this._connections.filter(
        connection => states.indexOf(connection.getState()) >= 0
      )
    );
  }

  public filterDirect(): ConnectionTable {
    return new ConnectionTable(
      this._connections.filter(
        connection => connection.getAddress().getProtocol() !== Protocol.VIA
      )
    );
  }

  public filterVia(): ConnectionTable {
    return new ConnectionTable(
      this._connections.filter(
        connection => connection.getAddress().getProtocol() === Protocol.VIA
      )
    );
  }

  public sortByQuality(): ConnectionTable {
    return new ConnectionTable(
      this._connections.sort(
        (a, b) => a.getMeter().getQuality() - b.getMeter().getQuality())
    );
  }

  public asArray(): Array<IConnection> {
    return this._connections.slice();
  }

  public shift(): IConnection {
    return this._connections.shift();
  }

  public pop(): IConnection {
    return this._connections.pop();
  }

  public get length(): number {
    return this._connections.length;
  }
}
