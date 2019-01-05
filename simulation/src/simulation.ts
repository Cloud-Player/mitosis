import {IClock, MasterClock, Message, Mitosis, Protocol, ProtocolConnectionMap} from 'mitosis';
import {MockConnection} from './connection/mock';
import {InstructionFactory} from './instruction/factory';

export class Simulation {

  private static _instance: Simulation;
  private readonly _clock: IClock;
  private _nodes: Map<string, Mitosis>;
  private _edges: Map<string, MockConnection>;

  public static getInstance() {
    if (!Simulation._instance) {
      Simulation._instance = new Simulation();
      ProtocolConnectionMap.set(Protocol.MOCK, MockConnection);
    }
    return Simulation._instance;
  }

  private constructor() {
    this._clock = new MasterClock();
    this._nodes = new Map();
    this._edges = new Map();
  }

  public addConnection(from: string, to: string, connection: MockConnection) {
    const local = this._nodes.get(from);
    const remote = this._nodes.get(to);
    if (!local) {
      return console.error('connection impossible: local missing', from, to);
    } else if (!remote) {
      return console.error('connection impossible: remote hung up', from, to);
    }

    if (!this._edges.get([from, to].join('-'))) {
      this._edges.set([from, to].join('-'), connection);
    }
    if (!this._edges.get([to, from].join('-'))) {
      remote.getRoutingTable().connectTo(local.getMyAddress());
    }
  }

  public removeConnection(from: string, to: string) {
    const directions = [[from, to].join('-'), [to, from].join('-')];
    directions.forEach(
      key => {
        const connection = this._edges.get(key);
        if (connection) {
          connection.onClose();
          this._edges.delete(key);
        }
      }
    );
  }

  public deliverMessage(from: string, to: string, message: Message) {
    const connection = this._edges.get([to, from].join('-'));
    if (connection) {
      connection.onMessage(message);
    } else {
      console.error('could not deliver', message);
    }
  }

  public addNode(mitosis: Mitosis) {
    this._nodes.set(mitosis.getMyAddress().getId(), mitosis);
  }

  public removeNode(mitosis: Mitosis) {
    this.removeNodeById(mitosis.getMyAddress().getId());
  }

  public removeNodeById(id: string) {
    this._nodes.delete(id);
  }

  public getClock(): IClock {
    return this._clock;
  }

  public getEdges(): Array<MockConnection> {
    return Array.from(this._edges.values());
  }

  public getNodes(): Array<Mitosis> {
    return Array.from(this._nodes.values());
  }

  public onUpdate(callback: () => void) {
    this._clock.setInterval(callback);
  }

  public start(scenarioJSON: { instructions: Array<any> }) {
    const instructions = InstructionFactory.arrayFromJSON(scenarioJSON);
    instructions.forEach(
      instr => {
        this._clock.setTimeout(instr.execute.bind(instr, this), instr.getTick());
      });
    this._clock.start();
  }
}
