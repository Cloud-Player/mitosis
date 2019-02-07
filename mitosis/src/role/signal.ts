import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {onboardNewbie} from './task/onboard-newbie';
import {publishSignalAndRouterUpdate} from './task/publish-signal-and-router-update';
import {removeSuperfluousConnections} from './task/remove-superfluous-connections';

export class Signal implements IRole {

  public onTick(mitosis: Mitosis): void {
    removeSuperfluousConnections(mitosis);
    publishSignalAndRouterUpdate(mitosis);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    onboardNewbie(mitosis, message);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.ROUTER);
  }
}
