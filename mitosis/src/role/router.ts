import {RemotePeer} from '../peer/remote-peer';
import {IRole, ITaskSchedule, RoleType, TaskPhase} from './interface';
import {AbstractRole} from './role';
import {degradeToPeer} from './task/degrade-to-peer';
import {publishSignalAndRouterUpdate} from './task/publish-signal-and-router-update';
import {sendRouterAlive} from './task/send-router-alive';

export class Router extends AbstractRole implements IRole {

  private _sequenceNumber = 1;

  public getTaskSchedule(): Array<ITaskSchedule> {
    return [
      {phase: TaskPhase.CLEAN, interval: 1, task: degradeToPeer},

      {phase: TaskPhase.PUBLISH, interval: 4, task: publishSignalAndRouterUpdate},
      {phase: TaskPhase.PUBLISH, interval: 4, task: sendRouterAlive}
    ];
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }

  public nextSequenceNumber(): number {
    return this._sequenceNumber++;
  }
}
