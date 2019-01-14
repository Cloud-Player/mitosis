import {AbstractClock} from './clock';
import {ForkedClock} from './forked';
import {IClock} from './interface';

export class MasterClock extends AbstractClock implements IClock {

  private _masterCancelId: any;
  private _speed: number;

  public constructor(speed: number = 1000) {
    super();
    this._speed = speed;
  }

  public fork(): IClock {
    const forked = new ForkedClock(this);
    forked.start();
    return forked;
  }

  public setSpeed(speed: number) {
    this._speed = speed;
  }

  public startClock(): void {
    this._masterCancelId = setInterval(this.tick.bind(this), this._speed);
  }

  public pauseClock(): void {
    clearInterval(this._masterCancelId);
  }
}
