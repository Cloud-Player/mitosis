import {Address, IClock, MasterClock, Message, Mitosis, Protocol, ProtocolConnectionMap} from 'mitosis';
import {MockConnection} from './connection/mock';
import {Edge} from './edge/edge';
import {InstructionFactory} from './instruction/factory';
import {Node} from './node/node';

export class Simulation {

  private static _instance: Simulation;
  private readonly _clock: IClock;
  private _nodes: Map<string, Node>;
  private _edges: Map<string, Edge>;

  public static getInstance() {
    if (!Simulation._instance) {
      Simulation._instance = new Simulation();
      ProtocolConnectionMap.set(Protocol.WEBSOCKET_UNSECURE, MockConnection);
      ProtocolConnectionMap.set(Protocol.WEBSOCKET, MockConnection);
      ProtocolConnectionMap.set(Protocol.WEBRTC, MockConnection);
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
      connection.onError(`local missing from ${from} to ${to}`);
      return;
    } else if (!remote) {
      connection.onError(`remote hung up from ${from} to ${to}`);
      return;
    }

    if (!this._edges.get([from, to].join('-'))) {
      this._edges.set([from, to].join('-'), new Edge(from, connection));
    }
    if (!this._edges.get([to, from].join('-'))) {
      const localAddress = new Address(
        local.getMitosis().getMyAddress().getId(),
        connection.getAddress().getProtocol(),
        connection.getAddress().getLocation()
      );
      remote.getMitosis().getRoutingTable().connectTo(localAddress);
    }
  }

  public removeConnection(from: string, to: string) {
    const directions = [[from, to].join('-'), [to, from].join('-')];
    directions.forEach(
      key => {
        const edge = this._edges.get(key);
        if (edge) {
          (edge.getConnection() as MockConnection).onClose();
          this._edges.delete(key);
        }
      }
    );
  }

  public deliverMessage(from: string, to: string, delay: number, message: Message) {
    const edge = this._edges.get([to, from].join('-'));
    if (edge) {
      /*
        this._clock.setTimeout(() => {
          (edge.getConnection() as MockConnection).onMessage(message);
        }, delay);
      */
      (edge.getConnection() as MockConnection).onMessage(message);
    } else {
      throw new Error('mock connection failed to deliver');
    }
  }

  public addNode(mitosis: Mitosis) {
    this._nodes.set(mitosis.getMyAddress().getId(), new Node(mitosis));
  }

  public removeNode(mitosis: Mitosis) {
    this.removeNodeById(mitosis.getMyAddress().getId());
  }

  public removeNodeById(id: string) {
    const node = this._nodes.get(id);
    if (node) {
      node.getMitosis().destroy();
      this._nodes.delete(id);
    }
  }

  public getClock(): IClock {
    return this._clock;
  }

  public getEdges(): Array<Edge> {
    return Array.from(this._edges.values());
  }

  public getNodes(): Array<Node> {
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

export {Node} from './node/node';
export {Edge} from './edge/edge';
