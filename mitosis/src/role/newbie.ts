import {Message} from '../message/message';
import {Mitosis, RemotePeer, RoleType} from '../mitosis';
import {IRole} from './interface';
import {sendIntroduction} from './task/send-introduction';

export class Newbie implements IRole {

  public onTick(mitosis: Mitosis): void {
    sendIntroduction(mitosis);
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
