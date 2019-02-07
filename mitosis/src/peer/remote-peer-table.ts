import {ConnectionTable} from '../connection/connection-table';
import {RemotePeerMeter} from '../metering/remote-peer-meter';
import {RoleType} from '../role/interface';
import {Table} from '../util/table';
import {RemotePeer} from './remote-peer';

export class RemotePeerTable extends Table<RemotePeer, RemotePeerTable> {

  public filterConnections(callbackfn: (table: ConnectionTable) => ConnectionTable): RemotePeerTable {
    return new RemotePeerTable(
      this._values.filter(
        peer =>
          callbackfn(peer.getConnectionTable()).length > 0
      )
    );
  }

  public aggregateConnections(callbackfn: (table: ConnectionTable) => ConnectionTable): ConnectionTable {
    return new ConnectionTable(
      this._values
        .map(
          remotePeer => remotePeer.getConnectionTable()
        )
        .map(
          connectionTable => callbackfn(connectionTable).asArray()
        )
        .reduce(
          (previous, current) => previous.concat(current)
          , []
        )
    );
  }

  public filterByRole(...roles: Array<RoleType>): RemotePeerTable {
    return new RemotePeerTable(
      this._values.filter(
        peer =>
          peer.hasRole(...roles)
      )
    );
  }

  public filterIsProtected(isProtected: boolean): RemotePeerTable {
    return new RemotePeerTable(
      this._values.filter(
        peer =>
          peer.getMeter().getConnectionProtection() === (isProtected ? 1 : 0)
      )
    );
  }

  public filterById(peerId: string): RemotePeerTable {
    return new RemotePeerTable(
      this._values.filter(
        peer => peer.getId() === peerId
      )
    );
  }

  public sortByQuality(callbackfn: (meter: RemotePeerMeter) => number = meter => meter.getQuality()): RemotePeerTable {
    return this.sortBy(peer => callbackfn(peer.getMeter()));
  }

  public countConnections(callbackfn: (table: ConnectionTable) => ConnectionTable = table => table): number {
    return this._values
      .map(
        peer => callbackfn(peer.getConnectionTable()).length
      )
      .reduce(
        (previous, current) => previous + current,
        0
      );
  }

  public sortById(): RemotePeerTable {
    return this.sortBy(
      peer => peer.getId()
    );
  }

  public toString(): string {
    return JSON.stringify(
      this._values
        .map(peer => peer.getId()),
      undefined,
      2
    );
  }
}
