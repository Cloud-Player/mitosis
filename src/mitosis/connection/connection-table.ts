import {ConnectionState, IConnection} from './interface';
import {ViaConnection} from './via';

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
        connection => !(connection instanceof ViaConnection)
      )
    );
  }

  public sortByQuality(): ConnectionTable {
    return new ConnectionTable(
      this._connections.sort((a, b) => a.getQuality() - b.getQuality())
    );
  }

  public shift(): IConnection {
    return this._connections.shift();
  }

  public get length(): number {
    return this._connections.length;
  }
}
