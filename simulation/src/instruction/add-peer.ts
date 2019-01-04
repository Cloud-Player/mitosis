import {Mitosis} from 'mitosis';
import {MockEnclave} from '../enclave/mock';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class AddPeer extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const peer = new Mitosis(
      simulation.getClock(),
      new MockEnclave(),
      config.address,
      config.signal,
      config.roles);
    simulation.addNode(peer);
    console.log('added peer', peer.getMyAddress().getId());
  }
}
