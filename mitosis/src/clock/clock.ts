import {IScheduledCallback} from './interface';

export abstract class AbstractClock {

  private readonly _maxCancelId = Number.MAX_SAFE_INTEGER - 10;
  private _lastCancelId = 0;
  private _tickCounter = 0;
  private _isRunning = false;
  protected _intervals: Array<IScheduledCallback> = [];
  protected _timeouts: Array<IScheduledCallback> = [];

  private doTick(): void {
    this._timeouts.forEach(
      (value: IScheduledCallback) => {
        if (value.tick === this._tickCounter) {
          value.callback();
        }
      });
    this._intervals.forEach(
      (value: IScheduledCallback) => {
        if (this._tickCounter % value.tick === 0) {
          value.callback();
        }
      });
    this._timeouts = this._timeouts.filter(
      (value: IScheduledCallback) => {
        return value.tick > this._tickCounter;
      });
  }

  protected abstract startClock(speed?: number): void;

  protected abstract pauseClock(): void;

  public abstract getPrecisionTimestamp(): number;

  public tick(): void {
    try {
      this.doTick();
    } catch (error) {
      throw error;
    } finally {
      this._tickCounter++;
    }
  }

  public start() {
    this._isRunning = true;
    this.startClock();
  }

  public pause() {
    this._isRunning = false;
    this.pauseClock();
  }

  public stop(): void {
    this.pause();
    this._intervals.length = 0;
    this._timeouts.length = 0;
    this._tickCounter = 0;
  }

  public forward(tick: number): void {
    while (this._tickCounter < tick) {
      this.tick();
    }
  }

  public rewind(): void {
    this._tickCounter = 0;
    this._timeouts.length = 0;
  }

  public setInterval(callback: () => void, interval: number = 1): number {
    interval = Math.max(interval, 1);
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

  public setTimeout(callback: () => void, timeout: number = 1): number {
    timeout = Math.max(timeout, 1);
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

  public getTick() {
    return this._tickCounter;
  }

  public isRunning() {
    return this._isRunning;
  }

  public timeIt(): () => number {
    const start = this.getPrecisionTimestamp();
    return (): number => {
      return this.getPrecisionTimestamp() - start;
    };
  }
}
