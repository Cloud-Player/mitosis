import {
  ConfigurationMap,
  ConnectionState,
  IClock,
  IMessage,
  Logger,
  LogLevel,
  MasterClock,
  Mitosis,
  Protocol,
  ProtocolConnectionMap,
  RoleType
} from 'mitosis';
import {MockConnection} from './connection/mock';
import {WebRTCDataMockConnection} from './connection/webrtc-data-mock';
import {WebSocketMockConnection} from './connection/websocket-mock';
import {Edge} from './edge/edge';
import {InstructionFactory} from './instruction/factory';
import {AbstractInstruction} from './instruction/instruction';
import {Node} from './node/node';

export class Simulation {

  private static _instance: Simulation;
  private readonly _clock: IClock;
  private _nodes: Map<string, Node>;
  private _edges: Map<string, Edge>;

  private constructor() {
    this._clock = new MasterClock();
    this._nodes = new Map();
    this._edges = new Map();
  }

  public static getInstance() {
    if (!Simulation._instance) {
      Logger.setLevel(LogLevel.ERROR);
      Logger.getLogger('simulation').setLevel(LogLevel.DEBUG);
      Simulation._instance = new Simulation();
      ProtocolConnectionMap.set(Protocol.WEBSOCKET_UNSECURE, WebSocketMockConnection);
      ProtocolConnectionMap.set(Protocol.WEBSOCKET, WebSocketMockConnection);
      ProtocolConnectionMap.set(Protocol.WEBRTC_DATA, WebRTCDataMockConnection);
    }
    return Simulation._instance;
  }

  private configure(configuration: any): void {
    Object.keys(configuration)
      .filter(key =>
        ConfigurationMap.get(key as RoleType) !== undefined
      )
      .forEach(
        key => {
          Object.keys(ConfigurationMap.get(key as RoleType))
            .filter(
              attrib => configuration[key][attrib] !== undefined
            )
            .forEach(
              attrib => {
                // @ts-ignore
                ConfigurationMap.get(key as RoleType)[attrib] = configuration[key][attrib];
              }
            );
        }
      );
  }

  public establishConnection(from: string, to: string, location: string) {
    const inboundEdge = this.getEdge(to, from, location);
    if (inboundEdge) {
      const inConn = inboundEdge.getConnection();
      inConn.onOpen(inConn);
    } else {
      Logger.getLogger('simulation').error(`edge ${to} to ${from} does not exist`);
    }
    const outbound = this.getEdge(from, to, location);
    if (outbound) {
      const outConn = outbound.getConnection();
      outConn.onOpen(outConn);
    } else {
      Logger.getLogger('simulation').error(`edge ${from} to ${to} does not exist`);
    }
  }

  public addConnection(from: string, to: string, location: string, connection: MockConnection): void {
    const local = this._nodes.get(from);
    const remote = this._nodes.get(to);
    if (!local) {
      connection.onError(`local missing from ${from} to ${to}`);
      return;
    } else if (!remote) {
      connection.onError(`remote hung up from ${from} to ${to}`);
      return;
    }

    if (!this.getEdge(from, to, location)) {
      this.addEdge(from, to, location, new Edge(from, connection));
    }
  }

  public deliverMessage(from: string, to: string, location: string, delay: number, message: IMessage): void {
    const edge = this.getEdge(to, from, location);
    if (edge) {
      const sender = this._nodes.get(from);
      sender.onSendMessage(message);
      this._clock.setTimeout(() => {
        const connection = (edge.getConnection() as MockConnection);
        if (connection.getState() === ConnectionState.OPEN) {
          const receiver = this._nodes.get(to);
          receiver.onReceiveMessage(message);
          connection.onMessage(message);
        } else {
          Logger.getLogger('simulation').error(
            `failed to deliver ${message.getSubject()} to ${to} because connection is ${connection.getState()}`, message
          );
        }
      }, delay);
    } else {
      Logger.getLogger('simulation').error(
        `failed to deliver ${message.getSubject()} to ${to} because connection does not exist`, message);
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

  public getEdge(from: string, to: string, location: string): Edge {
    return this._edges.get([from, to, location].join('-'));
  }

  public addEdge(from: string, to: string, location: string, edge: Edge): void {
    this._edges.set([from, to, location].join('-'), edge);
  }

  public removeEdge(from: string, to: string, location: string): void {
    this._edges.delete([from, to, location].join('-'));
  }

  public getNodeMap(): Map<string, Node> {
    return this._nodes;
  }

  public onUpdate(callback: () => void): void {
    this._clock.setInterval(callback, 1);
  }

  public start(scenario: {
    instructions: Array<any>;
    configuration: { [role in RoleType | 'default']: { [key: string]: number | string } };
  }): void {
    this.configure(scenario.configuration || {});
    const instructions = InstructionFactory.arrayFromJSON(scenario.instructions);
    instructions.forEach(
      instr => {
        this._clock.setTimeout(instr.execute.bind(instr, this), instr.getTick());
      });
    this._clock.start();
  }

  public reset() {
    this._edges.clear();
    this._nodes.forEach((node) => {
      node.getMitosis().destroy();
    });
    this._nodes.clear();
    this._clock.stop();
  }
}

export {Node} from './node/node';
export {Edge} from './edge/edge';
export {LogEvent} from './node/event-logger';
export {StatLogEvent} from './statistics/stat-log-event';
export {MockConnection} from './connection/mock';
export {InstructionTypeMap} from './instruction/interface';
export {AbstractInstruction} from './instruction/instruction';
