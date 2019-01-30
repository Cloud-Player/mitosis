import {filter} from 'rxjs/operators';
import {IClock} from '../clock/interface';
import {Logger} from '../logger/logger';
import {ConnectionsPerAddress, ConnectionsPerAddressEventType} from '../peer/connections-per-address';
import {IConnectionEventType, IConnectionMeter, IConnectionMeterEvent} from './connection-meter/interface';
import {IMeter} from './interface';
import {Configuration} from '../configuration';

export class RemotePeerMeter implements IMeter {

  private _clock: IClock;
  private readonly _connectionsPerAddress: ConnectionsPerAddress;
  private _punishedConnections = 0;
  private _protectedConnections = 0;

  constructor(connectionsPerAddress: ConnectionsPerAddress, clock: IClock) {
    this._connectionsPerAddress = connectionsPerAddress;
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
          .warn('punish connection', event.connection.getAddress().toString());
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

  // returns value between 0 and 1 which is the average tq of all connections
  public getAverageConnectionQuality(): number {
    const summedTq = Array
      .from(this._connectionsPerAddress.values())
      .map(connection => connection.getMeter().getQuality())
      .reduce((previous, current) => previous + current, 0);
    return summedTq / this._connectionsPerAddress.size;
  }

  // returns 0 or 1. When at least one connection is protected it returns 1
  public getConnectionProtection(): 0 | 1 {
    return this._protectedConnections > 0 ? 1 : 0;
  }

  // returns value between 0 and 1. When no connection is punished it returns 1, when all are punished 0
  public getAverageConnectionPunishment(): number {
    const punishedConnectionsAmount = this._connectionsPerAddress.size - this._punishedConnections;
    return punishedConnectionsAmount / this._connectionsPerAddress.size;
  }

  /*
   * TODO
   * is it a good idea to have the protection quality aka newbie bonus as a quality vector?
   * It is good to protect the peer so she is not cleaned up immediatly but maybe not as a genral quality
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
