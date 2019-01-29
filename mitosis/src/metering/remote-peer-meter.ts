import {IClock} from '../clock/interface';
import {IMeter} from './interface';

export class RemotePeerMeter implements IMeter {

  private _clock: IClock;

  constructor(clock: IClock) {
    this._clock = clock;
  }

  public getQuality(): number {
    return 1;
  }

  public start(): void {
  }

  public stop(): void {
    this._clock.stop();
  }
}
