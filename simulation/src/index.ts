import {forceSimulation} from 'd3-force';
import {IClock} from 'mitosis/dist/clock/interface';
import {ControllableClock} from './clock/controllable';

export class Simulation {

  private _clock: IClock;

  public constructor() {
    this._clock = new ControllableClock();
    forceSimulation();
  }
}

const simulation = new Simulation();
