import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class AddConnection extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
  }
}
