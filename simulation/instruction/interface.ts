import {AddConnection} from './add-connection';
import {AddPeer} from './add-peer';
import {RemoveConnection} from './remove-connection';
import {RemovePeer} from './remove-peer';

export enum InstructionType {
  ADD_PEER = 'add-peer',
  REMOVE_PEER = 'remove-peer',
  ADD_CONNECTION = 'add-connection',
  REMOVE_CONNECTION = 'remove-connection'
}

export interface IInstructionConstructor {
  new(...args: Array<any>): IInstruction;
}

export const InstructionTypeMap: Map<InstructionType, IInstructionConstructor> = new Map([
  [InstructionType.ADD_PEER, AddPeer],
  [InstructionType.REMOVE_PEER, RemovePeer],
  [InstructionType.ADD_CONNECTION, AddConnection],
  [InstructionType.REMOVE_CONNECTION, RemoveConnection]
]);

export interface IInstruction {

  getTick(): number;

  getType(): InstructionType;

  getConfiguration(): {};

  execute(): void;
}
