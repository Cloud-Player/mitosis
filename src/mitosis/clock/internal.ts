import {Clock} from './clock';

export class InternalClock extends Clock {

  public constructor(milliseconds?: number) {
    super(milliseconds);
    this.start();
  }
}
