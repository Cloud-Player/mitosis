import {Logger, Mitosis} from 'mitosis';
import {MockEnclave} from '../enclave/mock';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class AddPeer extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const peer = new Mitosis(
      simulation.getClock().fork(),
      new MockEnclave(),
      config.address,
      config.signal,
      config.roles);
    Logger.getLogger('simulation').info('add peer', peer.getMyAddress().getId());
    simulation.addNode(peer);
  }
}
