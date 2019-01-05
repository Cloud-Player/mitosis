import {AbstractClock} from './clock';
import {ForkedClock} from './forked';
import {IClock} from './interface';

export class MasterClock extends AbstractClock implements IClock {

  private _masterIntervalId: any;
  private _msPerTick: number;

  public constructor(msPerTick: number = 1000) {
    super();
    this._msPerTick = msPerTick;
  }

  public fork(): IClock {
    const forked = new ForkedClock(this);
    forked.start();
    return forked;
  }

  public start(): void {
    this._masterIntervalId = setInterval(this.tick.bind(this), this._msPerTick);
  }

  public pause(): void {
    clearInterval(this._masterIntervalId);
  }
}
