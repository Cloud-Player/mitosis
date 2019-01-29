import {IMeter} from './interface';

export class ViaConnectionMeter implements IMeter {

  public getQuality(): number {
    // TODO: Calculate quality from PUs and direct connection
    return 1;
  }

  public start(): void {
  }

  public stop(): void {
  }
}
