import {RoleType} from 'mitosis';
import {Simulation} from '../simulation';
import {AddConnection} from './add-connection';
import {AddPeer} from './add-peer';
import {PauseClock} from './pause-clock';
import {RemoveConnection} from './remove-connection';
import {RemovePeer} from './remove-peer';
import {StartClock} from './start-clock';
import {StopClock} from './stop-clock';

export enum InstructionType {
  ADD_PEER = 'add-peer',
  REMOVE_PEER = 'remove-peer',
  ADD_CONNECTION = 'add-connection',
  REMOVE_CONNECTION = 'remove-connection',
  START_CLOCK = 'start-clock',
  PAUSE_CLOCK = 'pause-clock',
  STOP_CLOCK = 'stop-clock'
}

export type IInstructionConstructor = new(...args: Array<any>) => IInstruction;

export const InstructionTypeMap: Map<InstructionType, IInstructionConstructor> = new Map([
  [InstructionType.ADD_PEER, AddPeer],
  [InstructionType.REMOVE_PEER, RemovePeer],
  [InstructionType.ADD_CONNECTION, AddConnection],
  [InstructionType.REMOVE_CONNECTION, RemoveConnection],
  [InstructionType.START_CLOCK, StartClock],
  [InstructionType.PAUSE_CLOCK, PauseClock],
  [InstructionType.STOP_CLOCK, StopClock]
]);

export interface IConfiguration {
  address?: string;
  signal?: string;
  target?: string;
  roles?: Array<RoleType>;
}

export interface IInstruction {

  getTick(): number;

  getConfiguration(): IConfiguration;

  execute(simulation: Simulation): void;
}
