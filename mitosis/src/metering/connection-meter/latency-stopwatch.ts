import {IClock} from '../../clock/interface';
import {ConfigurationMap} from '../../configuration';

export class LatencyStopwatch {
  private _clock: IClock;
  private _timerPerSequence: Map<number, (() => number) | number>;

  constructor(clock: IClock) {
    this._clock = clock;
    this._timerPerSequence = new Map();
  }

  private getHighestSequence() {
    return Array
      .from(this._timerPerSequence.keys())
      .sort((a, b) => a - b)
      .pop();
  }

  private cleanUpOldSequences() {
    const highestSequence = this.getHighestSequence();
    const removeKeys = Array
      .from(this._timerPerSequence.keys())
      .filter(
        key => highestSequence - key >= ConfigurationMap.getDefault().LATENCY_WINDOW_SIZE
      );
    removeKeys
      .forEach(
        key => {
          this._timerPerSequence.delete(key);
        }
      );
  }

  public start(sequence: number) {
    if (!this._timerPerSequence.get(sequence)) {
      this._timerPerSequence.set(sequence, this._clock.timeIt());
    }
    this.cleanUpOldSequences();
  }

  public stop(sequence: number) {
    const existingTimer = this._timerPerSequence.get(sequence);
    if (typeof existingTimer === 'function') {
      this._timerPerSequence.set(sequence, existingTimer());
    }
  }

  public asArray(): Array<number> {
    return Array
      .from(this._timerPerSequence.entries())
      .filter(
        ([val, value]) => typeof value === 'number' && value > 0
      )
      .map(
        ([key, value]) => value as number
      );
  }
}
