import {AbstractClock} from './clock';
import {IClock, IScheduledCallback} from './interface';

export class ForkedClock extends AbstractClock implements IClock {

  private _masterClock: IClock;
  private _masterCallback: IScheduledCallback;

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
    this._masterCallback = this._masterClock.setInterval(this.tick.bind(this));
  }

  public pause(): void {
    this._masterClock.clearInterval(this._masterCallback);
    this._masterCallback = null;
  }
}
