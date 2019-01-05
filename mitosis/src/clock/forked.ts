import {AbstractClock} from './clock';
import {IClock} from './interface';

export class ForkedClock extends AbstractClock implements IClock {

  private _masterClock: IClock;

  public constructor(masterClock: IClock) {
    super();
    this._masterClock = masterClock;
  }

  public fork(): IClock {
    const forked = new ForkedClock(this);
    forked.start();
    return forked;
  }

  public start(): void {
    this._masterClock.setInterval(this.tick);
  }

  public pause(): void {
    this._masterClock.clearInterval(this.tick);
  }
}
