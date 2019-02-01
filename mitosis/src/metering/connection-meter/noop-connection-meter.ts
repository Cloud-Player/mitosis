import {IClock} from '../../clock/interface';
import {IConnection} from '../../connection/interface';
import {ConnectionMeter} from './connection-meter';
import {IConnectionMeter} from './interface';

export class NoopConnectionMeter extends ConnectionMeter implements IConnectionMeter {
  public getQuality(): number {
    return 1;
  }

  public start(): void {
  }

  public stop(): void {
  }
}
