import {Logger} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class SetClockSpeed extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    Logger.getLogger('simulation').info('set clock speed', config.speed);
    simulation.getClock().setSpeed(config.speed);
    simulation.getClock().restart();
  }
}
