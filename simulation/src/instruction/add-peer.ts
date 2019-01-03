import {Mitosis} from 'mitosis';
import {MockEnclave} from '../enclave/mock';
import {Simulation} from '../index';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class AddPeer extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    const peer = new Mitosis(simulation.getClock(), new MockEnclave());
    simulation.getNodes().push(peer);
    console.log('added peer', peer.getMyAddress().getId());
  }
}
