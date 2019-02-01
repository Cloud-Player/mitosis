import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {onboardNewbie} from './task/onboard-newbie';

import {satisfyConnectionGoal} from './task/satisfy-connection-goal';

export class Signal implements IRole {

  public onTick(mitosis: Mitosis): void {
    satisfyConnectionGoal(mitosis);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    onboardNewbie(mitosis, message);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.ROUTER);
  }
}
