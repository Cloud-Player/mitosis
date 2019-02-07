import {Logger} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class FinishScenario extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    Logger.getLogger('simulation').info('scenario done');
    simulation.getClock().setSpeed(1000);
    simulation.getClock().pause();
  }
}
