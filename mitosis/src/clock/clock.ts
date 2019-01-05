import {IClock} from './interface';

export abstract class AbstractClock {

  protected _intervals: Array<[number, () => void]> = [];
  protected _timeouts: Array<[number, () => void]> = [];
  private _tickCounter = 0;

  private doTick(): void {
    this._intervals.forEach(
      value => {
        if (this._tickCounter % value[0] === 0) {
          value[1]();
        }
      });
    this._timeouts = this._timeouts.filter(
      value => {
        if (value[0] <= this._tickCounter) {
          value[1]();
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

  public setInterval(callback: () => void, interval: number = 1): void {
    this._intervals.push([interval, callback]);
  }

  public clearInterval(callback: () => void): void {
    this._intervals = this._intervals.filter(
      value => value[1] !== callback
    );
  }

  public setTimeout(callback: () => void, timeout: number = 0): void {
    this._timeouts.push([this._tickCounter + timeout, callback]);
  }

  public clearTimeout(callback: () => void): void {
    this._timeouts = this._timeouts.filter(
      value => value[1] !== callback
    );
  }
}
