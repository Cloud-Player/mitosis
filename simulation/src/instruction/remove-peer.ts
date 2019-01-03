import {Simulation} from '../index';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class RemovePeer extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
  }
}
