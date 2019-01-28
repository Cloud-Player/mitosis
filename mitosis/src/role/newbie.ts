import {Introduction} from '../message/introduction';
import {Message} from '../message/message';
import {Mitosis, RemotePeer, RoleType} from '../mitosis';
import {IRole} from './interface';

export class Newbie implements IRole {

  private sendIntroduction(mitosis: Mitosis): void {
    const introduction = new Introduction(
      mitosis.getMyAddress(),
      mitosis.getSignalAddress()
    );
    mitosis.getPeerManager()
      .connectTo(mitosis.getSignalAddress())
      .then(
        signal => signal.send(introduction)
      );
  }

  public onTick(mitosis: Mitosis): void {
    this.sendIntroduction(mitosis);
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
