import alea from 'alea';
import {
  ChurnType,
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
import {Subject} from 'rxjs';
import {MockClock} from './clock/mock-clock';
import {MockConnection} from './connection/mock';
import {WebRTCDataMockConnection} from './connection/webrtc-data-mock';
import {WebRTCStreamMockConnection} from './connection/webrtc-stream-mock';
import {WebSocketMockConnection} from './connection/websocket-mock';
import {Edge} from './edge/edge';
import {MockEnclave} from './enclave/mock';
import {InstructionFactory} from './instruction/factory';
import {AbstractInstruction} from './instruction/instruction';
import {IConnectionSettings, IMitosisSettings} from './interface';
import {Node} from './node/node';

export class Simulation {

  private static _instance: Simulation;
  private readonly _clock: IClock;
  private _subTicks: number;
  private _alea: () => number;
  private _nodes: Map<string, Node>;
  private _edges: Map<string, Edge>;
  private _nodeSubject: Subject<{ type: ChurnType, node: Node }>;
  private _loggingMaxSize = 100;

  private constructor() {
    this._clock = new MockClock();
    this._nodes = new Map();
    this._edges = new Map();
    this._nodeSubject = new Subject();
  }

  public static getInstance() {
    if (!Simulation._instance) {
      Logger.setLevel(LogLevel.FATAL);
      Logger.getLogger('simulation').setLevel(LogLevel.DEBUG);
      Simulation._instance = new Simulation();
      ProtocolConnectionMap.set(Protocol.WEBSOCKET_UNSECURE, WebSocketMockConnection);
      ProtocolConnectionMap.set(Protocol.WEBSOCKET, WebSocketMockConnection);
      ProtocolConnectionMap.set(Protocol.WEBRTC_DATA, WebRTCDataMockConnection);
      ProtocolConnectionMap.set(Protocol.WEBRTC_STREAM, WebRTCStreamMockConnection);
    }
    return Simulation._instance;
  }

  private configure(configuration: any): void {
    this._subTicks = configuration['sub-ticks'] || 1;
    this._alea = alea(configuration['random-seed'] || 'simulation');

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

  private getSignalNode(): Node {
    return Array.from(this._nodes.values())
      .find(
        node => node
          .getMitosis()
          .getRoleManager()
          .hasRole(RoleType.SIGNAL)
      );
  }

  private getPeerClock(): IClock {
    const offset = Math.floor(this.getRandom() * 10000);
    const clock = this._clock.fork();
    clock.setSpeed(this._subTicks);
    clock.forward(offset);
    return clock;
  }

  public setLoggerMaxSize(maxSize: number) {
    this._nodes.forEach(
      node => node.setLoggerMaxSize(maxSize)
    );
    this._loggingMaxSize = maxSize;
  }

  public getLoggerMaxSize(): number {
    return this._loggingMaxSize;
  }

  public getSubTicks(): number {
    return this._subTicks;
  }

  public establishConnection(from: string, to: string, location: string) {
    const inboundEdge = this.getEdge(to, from, location);
    let inConn;
    if (inboundEdge) {
      inConn = inboundEdge.getConnection();
      inConn.onOpen(inConn);
    } else {
      Logger.getLogger('simulation').error(`edge ${to} to ${from} does not exist`);
      return;
    }
    const outbound = this.getEdge(from, to, location);
    if (outbound) {
      const outConn = outbound.getConnection();
      if (inConn &&
        inConn.getAddress().getProtocol() === Protocol.WEBRTC_STREAM &&
        outConn.getAddress().getProtocol() === Protocol.WEBRTC_STREAM
      ) {
        const inStreamConn = inConn as WebRTCStreamMockConnection;
        const outStreamConn = outConn as WebRTCStreamMockConnection;
        const stream = inStreamConn.getStream();
        if (stream) {
          outStreamConn.setStream(stream.clone());
        }
        inStreamConn.observeStreamChurn()
          .subscribe(
            ev => {
              switch (ev.type) {
                case ChurnType.ADDED:
                  outStreamConn.setStream(ev.stream.clone());
                  break;
                case ChurnType.REMOVED:
                  outStreamConn.removeStream();
                  break;
              }
            }
          );
      }
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

  public deliverMessage(from: string, to: string, location: string, message: IMessage): void {
    const edge = this.getEdge(to, from, location);
    if (edge) {
      const sender = this._nodes.get(from);
      const receiver = this._nodes.get(to);
      if (!sender || !receiver) {
        return;
      }
      const senderDropProbability = this.getRandom();
      const receiverDropProbability = this.getRandom();
      const deliveryDelay = Math.floor((sender.getNetworkLatency() + receiver.getNetworkLatency()) / 2);
      if (senderDropProbability > sender.getNetworkStability()) {
        Logger.getLogger('simulation').info(
          `sender ${to} drops message ${message.getSubject()}`, message
        );
        return;
      } else {
        sender.onSendMessage(message, to);
      }

      this._clock.setTimeout(() => {
        const connection = (edge.getConnection() as MockConnection);
        if (connection.getState() === ConnectionState.OPEN) {
          if (receiverDropProbability > receiver.getNetworkStability()) {
            Logger.getLogger('simulation').info(
              `receiver ${to} drops message ${message.getSubject()}`, message
            );
            return;
          }
          receiver.onReceiveMessage(message, from);
          connection.onMessage(message);
        } else {
          Logger.getLogger(from).warn(
            `failed to deliver ${message.getSubject()} to ${to} because connection is ${connection.getState()}`, message
          );
        }
      }, deliveryDelay);

    } else {
      Logger.getLogger(from).warn(
        `failed to deliver ${message.getSubject()} to ${to} because connection does not exist`, message);
    }
  }

  public addNode(mitosis: Mitosis, connectionSettings?: IConnectionSettings): Node {
    const node = new Node(mitosis, connectionSettings);
    node.setLoggerMaxSize(this._loggingMaxSize);
    this._nodes.set(mitosis.getMyAddress().getId(), node);
    this._nodeSubject.next({type: ChurnType.ADDED, node});
    return node;
  }

  public removeNode(mitosis: Mitosis): boolean {
    return this.removeNodeById(mitosis.getMyAddress().getId());
  }

  public removeNodeById(id: string): boolean {
    const node = this._nodes.get(id);
    if (node) {
      node.getMitosis().destroy();
      const success = this._nodes.delete(id);
      if (success) {
        this._nodeSubject.next({type: ChurnType.REMOVED, node});
        return true;
      }
    }
    return false;
  }

  public getRandom(): number {
    return this._alea();
  }

  public getClock(): IClock {
    return this._clock;
  }

  public addPeer(mitosisSettings: IMitosisSettings = {}, connectionSettings?: IConnectionSettings): Node {
    if (!mitosisSettings.signalAddress) {
      const signal = this.getSignalNode();
      if (signal) {
        mitosisSettings.signalAddress = signal.getMitosis().getMyAddress().toString();
      }
    }
    const mitosis = new Mitosis(
      this.getPeerClock(),
      new MockEnclave(),
      mitosisSettings.peerAddress,
      mitosisSettings.signalAddress,
      mitosisSettings.roles
    );
    return this.addNode(mitosis, connectionSettings);
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

  public observeNodeChurn(): Subject<{ type: ChurnType, node: Node }> {
    return this._nodeSubject;
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

  public getReadableTicks(ticks: number) {
    const majorTicks = Math.floor(ticks / this.getSubTicks());
    const subTicks = ticks % this.getSubTicks();
    return `${majorTicks}′${subTicks}″`;
  }

  public reset() {
    this._edges.clear();
    this._nodes.forEach((node) => {
      node.destroy();
    });
    this._nodes.clear();
    this._clock.stop();
  }
}

export * from './interface';
export {Node} from './node/node';
export {Edge} from './edge/edge';
export {NodeEventLogger, LogEvent} from './node/event-logger';
export {StatLogEvent} from './statistics/stat-log-event';
export {MockConnection} from './connection/mock';
export {MockMediaStream} from './stream/mock-stream';
export {InstructionTypeMap} from './instruction/interface';
export {AbstractInstruction} from './instruction/instruction';
export {WebRTCStreamMockConnection} from './connection/webrtc-stream-mock';
