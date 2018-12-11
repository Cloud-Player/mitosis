import {InstructionType} from './type';

export interface IInstruction {

  getTick(): number;

  getType(): InstructionType;

  getConfiguration(): {};

  execute(): void;
}
