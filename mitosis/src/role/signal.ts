import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, ITaskSchedule, RoleType, TaskPhase} from './interface';
import {AbstractRole} from './role';
import {onboardNewbie} from './task/onboard-newbie';
import {publishSignalAndRouterUpdate} from './task/publish-signal-and-router-update';

export class Signal extends AbstractRole implements IRole {

  public getTaskSchedule(): Array<ITaskSchedule> {
    return [
      {phase: TaskPhase.PUBLISH, interval: 4, task: publishSignalAndRouterUpdate}
    ];
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    onboardNewbie(mitosis, message);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.ROUTER);
  }
}
