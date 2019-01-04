import {IClock} from './interface';

export class Clock implements IClock {

  protected _callbacks: Array<() => void>;
  private _interval: any;
  private _milliseconds: number;

  public constructor(milliseconds: number = 5000) {
    this._callbacks = [];
    this._milliseconds = milliseconds;
  }

  public onTick(callback: () => void): void {
    this._callbacks.push(callback);
  }

  public start(): void {
    this._interval = setInterval(this.tick.bind(this), this._milliseconds);
  }

  public stop(): void {
    clearInterval(this._interval);
  }

  private tick(): void {
    if (this._callbacks) {
      this._callbacks.forEach(callback => callback());
    }
  }
}
