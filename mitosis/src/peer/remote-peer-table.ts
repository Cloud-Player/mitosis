import {ConnectionTable} from '../connection/connection-table';
import {RoleType} from '../role/interface';
import {RemotePeer} from './remote-peer';

export class RemotePeerTable {

  private _remotePeers: Array<RemotePeer>;

  public constructor(remotePeers: Array<RemotePeer>) {
    this._remotePeers = remotePeers.slice();
  }

  public filterConnections(callbackfn: (table: ConnectionTable) => ConnectionTable): RemotePeerTable {
    return new RemotePeerTable(
      this._remotePeers.filter(
        peer =>
          callbackfn(peer.getConnectionTable()).length > 0
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

  public filterIsProtected(isProtected: boolean): RemotePeerTable {
    return new RemotePeerTable(
      this._remotePeers.filter(
        peer =>
          peer.getMeter().getConnectionProtection() === (isProtected ? 1 : 0)
      )
    );
  }

  public filterById(peerId: string): RemotePeerTable {
    return new RemotePeerTable(
      this._remotePeers.filter(
        peer => peer.getId() === peerId
      )
    );
  }

  public exclude(callbackfn: (table: RemotePeerTable) => RemotePeerTable): RemotePeerTable {
    const excludedPeers = callbackfn(this).asArray();
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

  public countConnections(callbackfn: (table: ConnectionTable) => ConnectionTable = t => t): number {
    return this._remotePeers
      .map(
        peer => callbackfn(peer.getConnectionTable()).length
      )
      .reduce(
        (previous, current) => previous + current,
        0
      );
  }

  public sortById(): RemotePeerTable {
    return new RemotePeerTable(
      this._remotePeers.sort(
        (a, b) => a.getId().localeCompare(b.getId())
      )
    );
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
