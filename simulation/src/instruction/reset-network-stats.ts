import {Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class ResetNetworkStats extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    simulation
      .getNodeMap()
      .forEach(
        node => node.resetNetworkStats()
      );
  }
}
