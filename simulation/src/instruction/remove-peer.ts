import {Address} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class RemovePeer extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const address = Address.fromString(config.address);
    console.info('👎 remove peer', address.getId());
    simulation.removeNodeById(address.getId());
  }
}
