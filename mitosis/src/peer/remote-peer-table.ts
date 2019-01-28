import {ConnectionTable} from '../connection/connection-table';
import {RoleType} from '../role/interface';
import {RemotePeer} from './remote-peer';

export class RemotePeerTable {

  private _remotePeers: Array<RemotePeer>;

  public constructor(remotePeers: Array<RemotePeer>) {
    this._remotePeers = remotePeers.slice();
  }

  public filterConnection(filterFunction: (table: ConnectionTable) => ConnectionTable): RemotePeerTable {
    return new RemotePeerTable(
      this._remotePeers.filter(
        peer =>
          filterFunction(peer.getConnectionTable()).length > 0
      )
    );
  }

  public filterByRole(...roles: Array<RoleType>): RemotePeerTable {
    return new RemotePeerTable(
      this._remotePeers.filter(
        peer =>
          peer.hasRole(...roles)
      )
    );
  }

  public exclude(filterFunction: (table: RemotePeerTable) => RemotePeerTable): RemotePeerTable {
    const excludedPeers = filterFunction(this).asArray();
    return new RemotePeerTable(
      this._remotePeers.filter(
        peer => excludedPeers.indexOf(peer) === -1
      )
    );
  }

  public sortByQuality(): RemotePeerTable {
    return new RemotePeerTable(
      this._remotePeers.sort(
        (a, b) => a.getQuality() - b.getQuality()
      )
    );
  }

  public countConnections(): number {
    let connections = 0;
    this._remotePeers.forEach(
      peer => connections += peer.getConnectionTable().length
    );
    return connections;
  }

  public asArray(): Array<RemotePeer> {
    return this._remotePeers.slice();
  }

  public shift(): RemotePeer {
    return this._remotePeers.shift();
  }

  public pop(): RemotePeer {
    return this._remotePeers.pop();
  }

  public get length(): number {
    return this._remotePeers.length;
  }

  public toString(): string {
    return JSON.stringify(
      this.asArray()
        .map(remotePeer => remotePeer.getId()),
      undefined,
      2
    );
  }
}