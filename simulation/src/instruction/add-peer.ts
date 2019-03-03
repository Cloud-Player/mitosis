import {Logger} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class AddPeer extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const node = simulation.addPeer(
      config.address,
      config.signal,
      config.roles
    );
    Logger.getLogger('simulation').info(`add peer ${node.getId()}`);
  }
}
