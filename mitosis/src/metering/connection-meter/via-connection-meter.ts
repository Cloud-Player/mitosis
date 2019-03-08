import {IClock} from '../../clock/interface';
import {IConnection} from '../../connection/interface';
import {ViaConnection} from '../../connection/via';
import {RemotePeerTable} from '../../peer/remote-peer-table';
import {RoleType} from '../../role/interface';
import {ConnectionMeter} from './connection-meter';
import {IConnectionMeter} from './interface';

export class ViaConnectionMeter extends ConnectionMeter implements IConnectionMeter {
  private _quality: number;

  constructor(connection: IConnection, clock: IClock, quality = 1) {
    super(connection, clock);
    this._quality = quality;
  }

  public updateLastSeen() {
    super.updateLastSeen();
  }

  public getQuality(): number {
    // TODO: Calculate quality from PUs and direct connection
    return this._quality;
  }

  public setQuality(quality: number) {
    this._quality = quality;
  }

  public getRouterLinkQuality(remotePeers: RemotePeerTable) {
    const viaAdress = this._connection.getAddress();
    const directPeer = remotePeers.filterById(viaAdress.getLocation()).pop();
    if (directPeer) {
      if (directPeer.hasRole(RoleType.SIGNAL, RoleType.ROUTER)) {
        return 1;
      } else {
        return directPeer.getMeter().getRouterLinkQuality();
      }
    } else {
      return 0;
    }
  }

  public start(): void {
  }

  public stop(): void {
  }
}
