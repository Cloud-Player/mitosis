import {RemotePeer} from '../mesh/remote-peer';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {Mitosis} from '../mitosis';
import {IRole} from './interface';

export class Newbie implements IRole {

  private _signal: RemotePeer;

  private sendTableUpdate(mitosis: Mitosis): void {
    const tableUpdate = new PeerUpdate(
      mitosis.getMyAddress(),
      mitosis.getSignalAddress(),
      mitosis.getRoutingTable().getPeers()
    );
    this._signal.send(tableUpdate);
  }

  public onTick(mitosis: Mitosis): void {
    if (!this._signal) {
      mitosis.getRoutingTable().connectTo(mitosis.getSignalAddress()).then(
        remotePeer => {
          this._signal = remotePeer;
        }
      );
    } else {
      this.sendTableUpdate(mitosis);
    }
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }
}
