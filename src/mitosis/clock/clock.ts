import {setInterval} from 'timers';
import Timeout = NodeJS.Timeout;

export class Clock implements IClock {

  protected _callbacks: Array<() => void>;
  private _interval: Timeout;
  private _milliseconds: number;

  public constructor(milliseconds: number = 1000) {
    this._callbacks = [];
    this._milliseconds = milliseconds;
  }

  public onTick(callback: () => void): void {
    this._callbacks.push(callback);
  }

  protected start(): void {
    this._interval = setInterval(this.tick.bind(this), this._milliseconds);
  }

  protected stop(): void {
    clearInterval(this._interval);
  }

  private tick(): void {
    if (this._callbacks) {
      this._callbacks.forEach(callback => callback());
    }
  }
}
