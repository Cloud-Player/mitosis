import {ControllableClock} from './clock/controllable';

export class Simulation {

  private _clock: IClock;

  public constructor() {
    this._clock = new ControllableClock();
  }
}
