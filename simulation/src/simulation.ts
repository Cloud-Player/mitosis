import {ConnectionState, IClock, Logger, LogLevel, MasterClock, Message, Mitosis, Protocol, ProtocolConnectionMap} from 'mitosis';
import {MockConnection} from './connection/mock';
import {WebRTCMockConnection} from './connection/webrtc-mock';
import {WebSocketMockConnection} from './connection/websocket-mock';
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
      ProtocolConnectionMap.set(Protocol.WEBSOCKET_UNSECURE, WebSocketMockConnection);
      ProtocolConnectionMap.set(Protocol.WEBSOCKET, WebSocketMockConnection);
      ProtocolConnectionMap.set(Protocol.WEBRTC, WebRTCMockConnection);
    }
    return Simulation._instance;
  }

  private constructor() {
    this._clock = new MasterClock();
    this._nodes = new Map();
    this._edges = new Map();
  }

  public establishConnection(from: string, to: string) {
    const edge1 = this._edges.get([to, from].join('-'));
    const edge2 = this._edges.get([from, to].join('-'));
    if (edge1) {
      const con1 = edge1.getConnection();
      con1.onOpen(con1);
    } else {
      console.error(`Edge ${to}->${from} does not exist! Can not establish connection`);
    }

    if (edge2) {
      const con2 = edge2.getConnection();
      con2.onOpen(con2);
    } else {
      console.error(`Edge ${from}->${to} does not exist! Can not establish connection`);
    }
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
  }

  public removeConnection(from: string, to: string): void {
    const edgeKey = [from, to].join('-');
    const edge = this._edges.get(edgeKey);
    if (edge) {
      this._edges.delete(edgeKey);
    }
  }

  public deliverMessage(from: string, to: string, delay: number, message: Message): void {
    const edge = this._edges.get([to, from].join('-'));
    if (edge) {
      this._clock.setTimeout(() => {
        const connection = (edge.getConnection() as MockConnection);
        if (connection.getState() === ConnectionState.OPEN) {
          connection.onMessage(message);
        } else {
          throw new Error(`mock connection failed to deliver message ${message.toString()} to edge ${to} because connection is not open!`);
        }
      }, delay);
    } else {
      throw new Error(`mock connection failed to deliver message ${message.toString()} to edge ${to} because connection does not exist!`);
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

  public getEdgeMap(): Map<string, Edge> {
    return this._edges;
  }

  public getNodeMap(): Map<string, Node> {
    return this._nodes;
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
