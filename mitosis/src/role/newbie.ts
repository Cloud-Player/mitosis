import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {AbstractRole} from './role';
import {sendIntroduction} from './task/send-introduction';

export class Newbie extends AbstractRole implements IRole {

  protected onTick(mitosis: Mitosis): void {
    sendIntroduction(mitosis);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
