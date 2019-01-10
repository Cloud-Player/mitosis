import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class StartClock extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    console.info(`🤞 start clock`);
    simulation.getClock().start();
  }
}
