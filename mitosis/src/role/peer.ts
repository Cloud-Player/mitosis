import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole} from './interface';
import {closeDuplicateConnections} from './task/close-duplicate-connections';
import {degradeToNewbie} from './task/degrade-to-newbie';
import {ensureRouterConnection} from './task/ensure-router-connection';
import {publishPeerUpdate} from './task/publish-peer-update';
import {removeSignal} from './task/remove-signal';
import {satisfyConnectionGoal} from './task/satisfy-connection-goal';
import {sendAlternatives} from './task/send-alternatives';

export class Peer implements IRole {

  public onTick(mitosis: Mitosis): void {
    closeDuplicateConnections(mitosis);
    satisfyConnectionGoal(mitosis);
    publishPeerUpdate(mitosis);
    removeSignal(mitosis);
    degradeToNewbie(mitosis);
    ensureRouterConnection(mitosis);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    sendAlternatives(mitosis, message);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return false;
  }
}
