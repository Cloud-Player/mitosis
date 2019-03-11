import {Logger} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class AddPeer extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const node = simulation.addPeer(
      {
        peerAddress: config.address,
        signalAddress: config.signal,
        roles: config.roles
      },
      config.connectionSettings ? config.connectionSettings : void(0)
    );
    Logger.getLogger('simulation').info(`add peer ${node.getId()}`);
  }
}
