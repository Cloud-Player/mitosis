import {IClock, IScheduledCallback} from './interface';

export abstract class AbstractClock {

  protected _intervals: Array<IScheduledCallback> = [];
  protected _timeouts: Array<IScheduledCallback> = [];
  private readonly _maxCancelId = Number.MAX_SAFE_INTEGER - 10;
  private _lastCancelId = 0;
  private _tickCounter = 0;

  private doTick(): void {
    this._intervals.forEach(
      (value: IScheduledCallback) => {
        if (this._tickCounter % value.tick === 0) {
          value.callback();
        }
      });
    this._timeouts = this._timeouts.filter(
      (value: IScheduledCallback) => {
        if (value.tick <= this._tickCounter) {
          value.callback();
          return false;
        } else {
          return true;
        }
      });
  }

  protected tick(): void {
    try {
      this.doTick();
    } catch (error) {
      throw error;
    } finally {
      this._tickCounter++;
    }
  }

  public abstract fork(): IClock;

  public abstract start(): void;

  public abstract pause(): void;

  public stop(): void {
    this.pause();
    this._intervals.length = 0;
    this._timeouts.length = 0;
  }

  public setInterval(callback: () => void, interval: number = 1): number {
    this._lastCancelId = (this._lastCancelId + 1) % this._maxCancelId;
    const scheduledCallback = {tick: interval, cancelId: this._lastCancelId, callback: callback};
    this._intervals.push(scheduledCallback);
    return this._lastCancelId;
  }

  public clearInterval(cancelId: number): void {
    this._intervals = this._intervals.filter(
      value => value.cancelId !== cancelId
    );
  }

  public setTimeout(callback: () => void, timeout: number = 0): number {
    this._lastCancelId = (this._lastCancelId + 1) % this._maxCancelId;
    const scheduledCallback = {tick: this._tickCounter + timeout, cancelId: this._lastCancelId, callback: callback};
    this._timeouts.push(scheduledCallback);
    return this._lastCancelId;
  }

  public clearTimeout(cancelId: number): void {
    this._timeouts = this._timeouts.filter(
      value => value.cancelId !== cancelId
    );
  }
}
