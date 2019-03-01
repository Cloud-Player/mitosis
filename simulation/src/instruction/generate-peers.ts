import {Address, Logger, Mitosis, Protocol, uuid} from 'mitosis';
import {MockEnclave} from '../enclave/mock';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class GeneratePeers extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    for (let i = 0; i < config.count; i++) {
      const address = new Address(uuid(), Protocol.WEBRTC_DATA);
      const peer = new Mitosis(
        simulation.getClockForId(address.getId()),
        new MockEnclave(),
        address.toString(),
        config.signal,
        config.roles);
      simulation.addNode(peer);
    }
    Logger.getLogger('simulation').info(`generate ${config.count} peers`);
  }
}
