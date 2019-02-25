import {Address, Logger} from 'mitosis';
import {MockMediaStream, Simulation} from '../simulation';
import {AbstractInstruction} from './instruction';
import {IInstruction} from './interface';

export class StartStream extends AbstractInstruction implements IInstruction {

  public execute(simulation: Simulation): void {
    const streamer = Address.fromString(this.getConfiguration().address);
    Logger.getLogger('simulation').info(`starting stream for ${streamer.getId()}`);

    const node = simulation.getNodeMap().get(streamer.getId());
    if (!node) {
      Logger.getLogger('simulation').error(`streamer not found ${streamer.getId()}`);
      return;
    }
    node.getMitosis().getStreamManager().setLocalStream(new MockMediaStream());
  }
}
