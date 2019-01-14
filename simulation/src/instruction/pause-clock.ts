import {Logger} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class PauseClock extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    Logger.getLogger('simulation').info('pause clock');
    simulation.getClock().pause();
  }
}
