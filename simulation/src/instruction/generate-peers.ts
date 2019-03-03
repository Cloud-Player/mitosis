import {Address, Logger, Protocol} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class GeneratePeers extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    let stack = 0;
    let generated = 0;
    let tick = 0;
    while (generated <= config.count) {
      stack += (config.rate || 1);
      tick ++;
      for (let i = 0; i < Math.floor(stack); i++) {
        stack--;
        generated++;
        const peerId = `p${('0000000' + generated).substr(-config.count.toString().length)}`;
        simulation
          .getClock()
          .setTimeout(
            () => simulation.addPeer(
              new Address(peerId, Protocol.WEBRTC_DATA).toString(),
              config.signal,
              config.roles
            ),
            tick
          );
      }
    }
    Logger.getLogger('simulation').info(`generate ${config.count} peers`);
  }
}
