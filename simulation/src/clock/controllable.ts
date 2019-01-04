import {Clock} from 'mitosis';

export class ControllableClock extends Clock {

  private _scheduledCallbacks: Map<number, Array<() => void>> = new Map();

  protected tick(): void {
    super.tick();
    const scheduled = this._scheduledCallbacks.get(this.getCounter());
    if (scheduled) {
      scheduled.forEach(callback => callback());
    }
  }

  public start(): void {
    super.start();
  }

  public stop(): void {
    super.stop();
  }

  public scheduleOnTick(counter: number, callback: () => void): void {
    if (!this._scheduledCallbacks.has(counter)) {
      this._scheduledCallbacks.set(counter, []);
    }
    this._scheduledCallbacks.get(counter).push(callback);
  }
}
