import {Message} from '../message/message';
import {ITaskSchedule, Mitosis, TaskPhase} from '../mitosis';
import {IRole} from './interface';
import {AbstractRole} from './role';
import {closeDuplicateConnections} from './task/close-duplicate-connections';
import {degradeToNewbie} from './task/degrade-to-newbie';
import {ensureRouterConnection} from './task/ensure-router-connection';
import {publishChannelAnnouncement} from './task/publish-channel-announcement';
import {publishPeerAlive} from './task/publish-peer-alive';
import {publishPeerUpdate} from './task/publish-peer-update';
import {removeExpiredConnections} from './task/remove-expired-connections';
import {removeSignal} from './task/remove-signal';
import {removeSuperfluousConnections} from './task/remove-superfluous-connections';
import {requestStreamConnection} from './task/request-stream-connection';
import {satisfyConnectionGoal} from './task/satisfy-connection-goal';
import {sendAlternatives} from './task/send-alternatives';
import {tryOtherPeers} from './task/try-other-peers';

export class Peer extends AbstractRole implements IRole {

  public getTaskSchedule(): Array<ITaskSchedule> {
    return [
      {phase: TaskPhase.CLEAN, interval: 1, task: removeSignal},
      {phase: TaskPhase.CLEAN, interval: 1, task: closeDuplicateConnections},
      {phase: TaskPhase.CLEAN, interval: 1, task: removeExpiredConnections},
      {phase: TaskPhase.CLEAN, interval: 1, task: removeSuperfluousConnections},
      {phase: TaskPhase.CLEAN, interval: 1, task: degradeToNewbie},
      {phase: TaskPhase.CLEAN, interval: 1, task: ensureRouterConnection},

      {phase: TaskPhase.ACQUIRE, interval: 1, task: satisfyConnectionGoal},
      {phase: TaskPhase.ACQUIRE, interval: 1, task: requestStreamConnection},
      {phase: TaskPhase.ACQUIRE, interval: 60, task: tryOtherPeers},

      {phase: TaskPhase.PUBLISH, interval: 4, task: publishPeerUpdate},
      {phase: TaskPhase.PUBLISH, interval: 2, task: publishChannelAnnouncement},
      {phase: TaskPhase.PUBLISH, interval: 4, task: publishPeerAlive}
    ];
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    sendAlternatives(mitosis, message);
  }
}
