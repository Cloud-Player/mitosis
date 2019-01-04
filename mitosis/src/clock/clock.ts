import {IClock} from './interface';

export class Clock implements IClock {

  protected _callbacks: Array<() => void> = [];
  private _interval: any;
  private _milliseconds: number;
  private _counter = 0;

  public constructor(milliseconds: number = 5000) {
    this._milliseconds = milliseconds;
  }

  private doTick(): void {
    this.tick();
    this._counter++;
  }

  protected getCounter(): number {
    return this._counter;
  }

  protected tick(): void {
    if (this._callbacks) {
      this._callbacks.forEach(callback => callback());
    }
  }

  public onTick(callback: () => void): void {
    this._callbacks.push(callback);
  }

  public start(): void {
    this._interval = setInterval(this.doTick.bind(this), this._milliseconds);
  }

  public stop(): void {
    clearInterval(this._interval);
  }
}
