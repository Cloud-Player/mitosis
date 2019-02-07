import {ConnectionMeter} from './connection-meter';
import {IConnectionMeter} from './interface';

export class NoopConnectionMeter extends ConnectionMeter implements IConnectionMeter {
  public getQuality(): number {
    return 1;
  }

  public isLastSeenExpired() {
    return false;
  }

  public start(): void {
  }

  public stop(): void {
  }
}
