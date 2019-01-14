import {Logger} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class StopClock extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    Logger.getLogger('simulation').info('stop clock');
    simulation.getClock().stop();
  }
}
