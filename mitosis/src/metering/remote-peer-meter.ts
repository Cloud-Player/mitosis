import {filter} from 'rxjs/operators';
import {IClock} from '../clock/interface';
import {Configuration} from '../configuration';
import {ConnectionTable} from '../connection/connection-table';
import {Logger} from '../logger/logger';
import {ConnectionsPerAddress, ConnectionsPerAddressEventType} from '../peer/connections-per-address';
import {RemotePeerTable} from '../peer/remote-peer-table';
import {IConnectionEventType, IConnectionMeter, IConnectionMeterEvent} from './connection-meter/interface';
import {IMeter} from './interface';

export class RemotePeerMeter implements IMeter {

  private readonly _clock: IClock;
  private readonly _mitosisId: string;
  private readonly _connectionsPerAddress: ConnectionsPerAddress;
  private _punishedConnections = 0;
  private _protectedConnections = 0;

  constructor(connectionsPerAddress: ConnectionsPerAddress, mitosisId: string, clock: IClock) {
    this._connectionsPerAddress = connectionsPerAddress;
    this._mitosisId = mitosisId;
    this._clock = clock;
    this.listenOnConnectionChurn();
  }

  private listenOnConnectionChurn() {
    this._connectionsPerAddress
      .observe()
      .pipe(
        filter(ev => ev.type === ConnectionsPerAddressEventType.ADD)
      )
      .subscribe((ev) => {
        (ev.entity.getMeter() as IConnectionMeter)
          .observe()
          .subscribe(
            this.listenOnConnectionMeter.bind(this)
          );
      });
  }

  private listenOnConnectionMeter(event: IConnectionMeterEvent) {
    switch (event.type) {
      case IConnectionEventType.PUNISHED:
        Logger.getLogger(event.connection.getAddress().getId())
          .warn(`punish connection to ${event.connection.getAddress().getId()}`, event.connection);
        this._punishedConnections++;
        this._clock.setTimeout(() => {
          this._punishedConnections--;
        }, Configuration.CONNECTION_METER_PUNISHMENT_TIME);
        break;
      case IConnectionEventType.UNPUNISHED:
        break;
      case IConnectionEventType.PROTECTED:
        this._protectedConnections++;
        break;
      case IConnectionEventType.UNPROTECTED:
        this._protectedConnections--;
        break;
    }
  }

  public getLastSeen(): number {
    return ConnectionTable
      .fromIterable(this._connectionsPerAddress.values())
      .map(
        connection => (connection.getMeter() as IConnectionMeter).getLastSeen()
      )
      .reduce(
        (previous, current) => Math.max(previous, current),
        0
      );
  }

  // returns value between 0 and 1 which is the average tq of all connections
  public getAverageConnectionQuality(): number {
    const quality = ConnectionTable
      .fromIterable(this._connectionsPerAddress.values())
      .map(
        connection => connection.getMeter().getQuality()
      )
      .reduce(
        (previous, current) => previous + current,
        0
      );
    return quality / this._connectionsPerAddress.size;
  }

  public getBestConnectionQuality(): number {
    return ConnectionTable
      .fromIterable(this._connectionsPerAddress.values())
      .map(
        connection => connection.getMeter().getQuality()
      )
      .reduce(
        (previous, current) => Math.max(previous, current),
        0
      );
  }

  // returns 0 or 1. When at least one connection is protected it returns 1
  public getConnectionProtection(): 0 | 1 {
    return this._protectedConnections > 0 ? 1 : 0;
  }

  public getConnectionSaturation(remotePeers: RemotePeerTable): number {
    // looks at the direct connections the metered peer reported and estimates its saturation
    const connectionCount = remotePeers
      .countConnections(
        table => table.filterVia(this._mitosisId)
      ) + 1;  // this is our own connection

    const saturation = ((Configuration.DIRECT_CONNECTIONS_MAX - connectionCount) / Configuration.DIRECT_CONNECTIONS_MAX_GOAL);
    return 1 - Math.min(Math.max(0, saturation), 1);
  }

  // returns value between 0 and 1. When no connection is punished it returns 1, when all are punished 0
  public getAverageConnectionPunishment(): number {
    const punishedConnectionsAmount = this._connectionsPerAddress.size - this._punishedConnections;
    return punishedConnectionsAmount / this._connectionsPerAddress.size;
  }

  // returns the quality of this peer that is reported to our direct connections
  public getPeerUpdateQuality(remotePeers: RemotePeerTable): number {
    return this.getBestConnectionQuality() * this.getConnectionSaturation(remotePeers);
  }

  /*
   * TODO
   * is it a good idea to have the protection quality aka newbie bonus as a quality vector?
   * It is good to protect the peer so she is not cleaned up immediately but maybe not as a general quality
   * because it only has the meaning that he is new
   */
  public getQuality(): number {
    return this.getAverageConnectionQuality() * (this.getAverageConnectionPunishment() + this.getConnectionProtection());
  }

  public start(): void {
  }

  public stop(): void {
    this._clock.stop();
  }
}
