import {Address, Logger} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class RemoveConnection extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const from = Address.fromString(config.address);
    const to = Address.fromString(config.target);
    Logger.getLogger('simulation').info(`disconnect ${from.getId()} from ${to.getId()}`);
    simulation.removeConnection(from.getId(), to.getId());
  }
}
