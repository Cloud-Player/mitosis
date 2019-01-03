import {forceSimulation} from 'd3-force';
import {IClock, Mitosis} from 'mitosis';
import {ControllableClock} from './clock/controllable';
import {InstructionFactory} from './instruction/factory';

export class Simulation {

  private readonly _clock: IClock;
  private _nodes: Array<Mitosis> = [];
  private _edges: Array<[string, string]> = [];

  public constructor() {
    this._clock = new ControllableClock();
    const instructions = InstructionFactory.arrayFromJSON('hello-world');
    instructions.forEach(instr => instr.execute(this));
    forceSimulation();
  }

  public getClock(): IClock {
    return this._clock;
  }

  public getEdges(): Array<[string, string]> {
    return this._edges;
  }

  public getNodes(): Array<Mitosis> {
    return this._nodes;
  }
}

const simulation = new Simulation();
