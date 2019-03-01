import {AbstractClock} from './clock';
import {IClock} from './interface';

export class ForkedClock extends AbstractClock implements IClock {

  private _masterClock: IClock;
  private _cancelId: number;

  public constructor(masterClock: IClock) {
    super();
    this._masterClock = masterClock;
  }

  public fork(): IClock {
    const forked = new ForkedClock(this);
    forked.start();
    return forked;
  }

  public setSpeed(speed: number): void {
    this.pauseClock();
    this.startClock(speed);
  }

  public startClock(speed?: number): void {
    this._cancelId = this._masterClock.setInterval(this.tick.bind(this), speed);
  }

  public pauseClock(): void {
    this._masterClock.clearInterval(this._cancelId);
    this._cancelId = null;
  }
}
