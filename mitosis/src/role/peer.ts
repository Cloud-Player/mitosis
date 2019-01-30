import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole} from './interface';
import {degradeToNewbie} from './task/degradeToNewbie';
import {publishPeerUpdate} from './task/publish-peer-update';
import {removeSignal} from './task/remove-signal';
import {satisfyConnectionGoal} from './task/satisfy-connection-goal';

export class Peer implements IRole {

  public onTick(mitosis: Mitosis): void {
    satisfyConnectionGoal(mitosis);
    publishPeerUpdate(mitosis);
    removeSignal(mitosis);
    degradeToNewbie(mitosis);
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return false;
  }
}
