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
    const connectionSettings = config.connectionSettings || {
      latency: {from: 1, to: 1},
      stability: {from: 1, to: 1}
    };
    while (generated <= config.count) {
      stack += (config.rate || 1);
      tick++;
      for (let i = 0; i < Math.floor(stack); i++) {
        stack--;
        generated++;
        const peerId = `p${('0000000' + generated).substr(-config.count.toString().length)}`;
        simulation
          .getClock()
          .setTimeout(
            () => simulation.addPeer(
              {
                peerAddress: new Address(peerId, Protocol.WEBRTC_DATA).toString(),
                signalAddress: config.signal,
                roles: config.roles
              },
              {
                latency: simulation.getRandomBetween(connectionSettings.latency.from, connectionSettings.latency.to),
                stability: simulation.getRandomBetween(connectionSettings.stability.from * 10, connectionSettings.stability.to * 10),
                establishDelay: simulation.getRandomBetween(connectionSettings.establishDelay.from, connectionSettings.establishDelay.to)
              }
            ),
            tick
          );
      }
    }
    Logger.getLogger('simulation').info(`generate ${config.count} peers`);
  }
}
