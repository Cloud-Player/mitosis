import {IMeter} from './interface';

export class NoopConnectionMeter implements IMeter {

  public getQuality(): number {
    return 1;
  }

  public start(): void {
  }

  public stop(): void {
  }
}
