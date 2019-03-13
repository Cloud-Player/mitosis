import {Logger, RoleType} from 'mitosis';
import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class EliminatePeers extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const config = this.getConfiguration();
    let stack = 0;
    let eliminated = 0;
    let tick = 0;
    while (eliminated <= config.count) {
      stack += (config.rate || 1);
      tick++;
      const full = Math.floor(stack);
      for (let i = 0; i < full; i++) {
        stack--;
        eliminated++;
        simulation
          .getClock()
          .setTimeout(
            () => {
              const peers = Array.from(simulation
                .getNodeMap()
                .values())
                .filter(
                  node => node
                    .getMitosis()
                    .getRoleManager()
                    .hasRole(RoleType.PEER)
                );
              const index = simulation.getRandom() * simulation.getNodeMap.length;
              if (!peers[index]) {
                return;
              }
              const peerId = peers[index].getId();
              const success = simulation.removeNodeById(peerId);
              Logger.getLogger('simulation')
                .warn(`${success ? '' : 'could not'} eliminated peer ${peerId}`);
            },
            tick
          );
      }
    }
    Logger.getLogger('simulation').info(`eliminate ${config.count} peers`);
  }
}
