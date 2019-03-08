import {ITaskSchedule, TaskPhase} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {AbstractRole} from './role';
import {sendIntroduction} from './task/send-introduction';

export class Newbie extends AbstractRole implements IRole {

  public getTaskSchedule(): Array<ITaskSchedule> {
    return [
      {phase: TaskPhase.PUBLISH, interval: 1, task: sendIntroduction}
    ];
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
