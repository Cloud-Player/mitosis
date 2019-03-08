import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
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

  protected onTick(mitosis: Mitosis): void {
    // clean
    removeSignal(mitosis);
    closeDuplicateConnections(mitosis);
    removeExpiredConnections(mitosis);
    removeSuperfluousConnections(mitosis);
    degradeToNewbie(mitosis);
    ensureRouterConnection(mitosis);

    // acquire
    satisfyConnectionGoal(mitosis);
    requestStreamConnection(mitosis);
    if (mitosis.getClock().getTick() % 60 === 0) {
      tryOtherPeers(mitosis);
    }

    // publish
    publishPeerUpdate(mitosis);
    publishChannelAnnouncement(mitosis);
    publishPeerAlive(mitosis);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    sendAlternatives(mitosis, message);
  }
}
