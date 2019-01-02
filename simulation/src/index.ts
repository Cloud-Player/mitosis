import {IClock} from 'mitosis/src/clock/interface';
import {ControllableClock} from './clock/controllable';

export class Simulation {

  private _clock: IClock;

  public constructor() {
    this._clock = new ControllableClock();
  }
}

const simulation = new Simulation();
