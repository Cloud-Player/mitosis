import {IConnectionMeter} from '../metering/connection-meter/interface';
import {RemotePeerTable} from '../peer/remote-peer-table';
import {Table} from '../util/table';
import {ConnectionState, IConnection, Protocol} from './interface';

export class ConnectionTable extends Table<IConnection, ConnectionTable> {

  public filterByStates(...states: Array<ConnectionState>): ConnectionTable {
    return new ConnectionTable(
      this._values.filter(
        connection => states.indexOf(connection.getState()) >= 0
      )
    );
  }

  public filterDirect(): ConnectionTable {
    return this.exclude(
      table => table.filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI)
    );
  }

  public filterDirectData(): ConnectionTable {
    return this.filterByProtocol(Protocol.WEBSOCKET, Protocol.WEBSOCKET_UNSECURE, Protocol.WEBRTC_DATA);
  }

  public filterByProtocol(...protocols: Array<Protocol>): ConnectionTable {
    return new ConnectionTable(
      this._values.filter(
        connection => connection.getAddress().isProtocol(...protocols)
      )
    );
  }

  public filterByLocation(...locations: Array<string>) {
    return new ConnectionTable(
      this._values.filter(
        connection => locations.includes(connection.getAddress().getLocation())
      )
    );
  }

  public filterByMeter(callbackfn: (meter: IConnectionMeter) => boolean): ConnectionTable {
    return new ConnectionTable(
      this._values.filter(
        connection => callbackfn(connection.getMeter())
      )
    );
  }

  public sortByQuality(
    remotePeers: RemotePeerTable,
    callbackfn: (meter: IConnectionMeter, remotePeers: RemotePeerTable) => number =
      (meter: IConnectionMeter, table: RemotePeerTable) => meter.getQuality(table)
  ): ConnectionTable {
    return this.sortBy(
      connection =>
        callbackfn(connection.getMeter() as IConnectionMeter, remotePeers)
    );
  }
}
