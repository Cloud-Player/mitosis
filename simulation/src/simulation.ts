import {Address, IClock, Logger, LogLevel, MasterClock, Message, Mitosis, Protocol, ProtocolConnectionMap} from 'mitosis';
import {MockConnection} from './connection/mock';
import {WebRTCMockConnection} from './connection/webrtc-mock';
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
      Logger.setLogLevel(LogLevel.WARN);
      Simulation._instance = new Simulation();
      ProtocolConnectionMap.set(Protocol.WEBSOCKET_UNSECURE, MockConnection);
      ProtocolConnectionMap.set(Protocol.WEBSOCKET, MockConnection);
      ProtocolConnectionMap.set(Protocol.WEBRTC, WebRTCMockConnection);
    }
    return Simulation._instance;
  }

  private constructor() {
    this._clock = new MasterClock();
    this._nodes = new Map();
    this._edges = new Map();
  }

  public addConnection(from: string, to: string, connection: MockConnection): void {
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

  public removeConnection(from: string, to: string): void {
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

  public deliverMessage(from: string, to: string, delay: number, message: Message): void {
    const edge = this._edges.get([to, from].join('-'));
    if (edge) {
      this._clock.setTimeout(() => {
        (edge.getConnection() as MockConnection).onMessage(message);
      }, delay);
    } else {
      throw new Error(`mock connection failed to deliver message ${message.toString()} to edge ${to}`);
    }
  }

  public addNode(mitosis: Mitosis): void {
    this._nodes.set(mitosis.getMyAddress().getId(), new Node(mitosis));
  }

  public removeNode(mitosis: Mitosis): void {
    this.removeNodeById(mitosis.getMyAddress().getId());
  }

  public removeNodeById(id: string): void {
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

  public onUpdate(callback: () => void): void {
    this._clock.setInterval(callback, 1);
  }

  public start(scenarioJSON: { instructions: Array<any> }): void {
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
export {MockConnection} from './connection/mock';
