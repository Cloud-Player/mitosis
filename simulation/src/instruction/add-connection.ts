import {Address} from 'mitosis';
import {MockConnection} from '../connection/mock';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class AddConnection extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const from = Address.fromString(config.address);
    const to = Address.fromString(config.target);
    const connection = new MockConnection(from);
    console.info(`👉 connect ${from.getId()} to ${to.getId()}`);
    simulation.addConnection(from.getId(), to.getId(), connection);
  }
}
