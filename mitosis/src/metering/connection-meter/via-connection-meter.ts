import {IClock} from '../../clock/interface';
import {IConnection} from '../../connection/interface';
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

  public start(): void {
  }

  public stop(): void {
  }
}
