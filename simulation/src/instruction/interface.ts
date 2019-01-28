import {RoleType} from 'mitosis';
import {Simulation} from '../simulation';
import {AddPeer} from './add-peer';
import {PauseClock} from './pause-clock';
import {RemoveConnection} from './remove-connection';
import {RemovePeer} from './remove-peer';
import {SetClockSpeed} from './set-clock-speed';
import {StartClock} from './start-clock';
import {StopClock} from './stop-clock';

export enum InstructionType {
  ADD_PEER = 'add-peer',
  REMOVE_PEER = 'remove-peer',
  REMOVE_CONNECTION = 'remove-connection',
  START_CLOCK = 'start-clock',
  PAUSE_CLOCK = 'pause-clock',
  STOP_CLOCK = 'stop-clock',
  SET_CLOCK_SPEED = 'set-clock-speed'
}

export type IInstructionConstructor = new(...args: Array<any>) => IInstruction;

export const InstructionTypeMap: Map<InstructionType, IInstructionConstructor> = new Map([
  [InstructionType.ADD_PEER, AddPeer],
  [InstructionType.REMOVE_PEER, RemovePeer],
  [InstructionType.REMOVE_CONNECTION, RemoveConnection],
  [InstructionType.START_CLOCK, StartClock],
  [InstructionType.PAUSE_CLOCK, PauseClock],
  [InstructionType.STOP_CLOCK, StopClock],
  [InstructionType.SET_CLOCK_SPEED, SetClockSpeed]
]);

export interface IConfiguration {
  address?: string;
  signal?: string;
  target?: string;
  speed?: number;
  roles?: Array<RoleType>;
}

export interface IInstruction {

  getTick(): number;

  getConfiguration(): IConfiguration;

  execute(simulation: Simulation): void;
}
