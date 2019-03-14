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
    const connectionSettings = config.connectionSettings || {};
    connectionSettings.latency = connectionSettings.latency || {from: 1, to: 1};
    connectionSettings.stability = connectionSettings.stability || {from: 1, to: 1};
    connectionSettings.establishDelay = connectionSettings.establishDelay || {from: 1, to: 1};
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
            () => {
              const settings = {
                latency: simulation.getRandomBetween(connectionSettings.latency.from, connectionSettings.latency.to),
                stability: simulation.getRandomBetween(connectionSettings.stability.from, connectionSettings.stability.to),
                establishDelay: simulation.getRandomBetween(connectionSettings.establishDelay.from, connectionSettings.establishDelay.to)
              };
              simulation.addPeer(
                {
                  peerAddress: new Address(peerId, Protocol.WEBRTC_DATA).toString(),
                  signalAddress: config.signal,
                  roles: config.roles
                },
                settings
              );
            },
            tick
          );
      }
    }
    Logger.getLogger('simulation').info(`generate ${config.count} peers`);
  }
}
