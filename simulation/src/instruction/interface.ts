import {RoleType} from 'mitosis';
import {Simulation} from '../simulation';
import {AddPeer} from './add-peer';
import {EliminatePeers} from './eliminate-peers';
import {FinishScenario} from './finish-scenario';
import {GeneratePeers} from './generate-peers';
import {PauseClock} from './pause-clock';
import {RemoveConnection} from './remove-connection';
import {RemovePeer} from './remove-peer';
import {SetClockSpeed} from './set-clock-speed';
import {StartClock} from './start-clock';
import {StartStream} from './start-stream';
import {StopClock} from './stop-clock';

export enum InstructionType {
  ADD_PEER = 'add-peer',
  GENERATE_PEERS = 'generate-peers',
  ELIMINATE_PEERS = 'eliminate-peers',
  REMOVE_PEER = 'remove-peer',
  REMOVE_CONNECTION = 'remove-connection',
  START_CLOCK = 'start-clock',
  PAUSE_CLOCK = 'pause-clock',
  STOP_CLOCK = 'stop-clock',
  SET_CLOCK_SPEED = 'set-clock-speed',
  FINISH_SCENARIO = 'finish-scenario',
  START_STREAM = 'start-stream'
}

export type IInstructionConstructor = new(...args: Array<any>) => IInstruction;

export const InstructionTypeMap: Map<InstructionType, IInstructionConstructor> = new Map([
  [InstructionType.ADD_PEER, AddPeer],
  [InstructionType.GENERATE_PEERS, GeneratePeers],
  [InstructionType.ELIMINATE_PEERS, EliminatePeers],
  [InstructionType.REMOVE_PEER, RemovePeer],
  [InstructionType.REMOVE_CONNECTION, RemoveConnection],
  [InstructionType.START_CLOCK, StartClock],
  [InstructionType.PAUSE_CLOCK, PauseClock],
  [InstructionType.STOP_CLOCK, StopClock],
  [InstructionType.SET_CLOCK_SPEED, SetClockSpeed],
  [InstructionType.FINISH_SCENARIO, FinishScenario],
  [InstructionType.START_STREAM, StartStream],
]);

export interface IConfiguration {
  address?: string;
  target?: string;
  speed?: number;
  count?: number;
  rate?: number;
  roles?: Array<RoleType>;
  default?: any;
  newbie?: any;
  peer?: any;
  router?: any;
  signal?: any;

  [key: string]: any;
}

export interface IInstruction {

  getTick(): number;

  getConfiguration(): IConfiguration;

  execute(simulation: Simulation): void;
}
