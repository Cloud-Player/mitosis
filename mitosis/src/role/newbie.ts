import {RemotePeer} from '../mesh/remote-peer';
import {Introduction} from '../message/introduction';
import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {IRole} from './interface';

export class Newbie implements IRole {

  private _signal: RemotePeer;

  private sendIntroduction(mitosis: Mitosis): void {
    const introduction = new Introduction(
      mitosis.getMyAddress(),
      mitosis.getSignalAddress()
    );
    this._signal.send(introduction);
  }

  public onTick(mitosis: Mitosis): void {
    if (!this._signal) {
      mitosis.getRoutingTable().connectTo(mitosis.getSignalAddress()).then(
        remotePeer => {
          this._signal = remotePeer;
        }
      );
    } else {
      this.sendIntroduction(mitosis);
    }
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }
}
