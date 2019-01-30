import {IClock} from '../../clock/interface';
import {ConnectionMeter} from './connection-meter';
import {IConnectionMeter} from './interface';

export class ViaConnectionMeter extends ConnectionMeter implements IConnectionMeter {
  protected _clock: IClock;

  public getQuality(): number {
    // TODO: Calculate quality from PUs and direct connection
    return 1;
  }

  public start(): void {
  }

  public stop(): void {
  }
}
