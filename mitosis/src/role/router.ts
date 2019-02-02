import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {degradeToPeer} from './task/degrade-to-peer';
import {sendRouterAlive} from './task/send-router-alive';

export class Router implements IRole {
  private sequenceNumber = 1;

  public onTick(mitosis: Mitosis): void {
    sendRouterAlive(mitosis, this.sequenceNumber++);
    degradeToPeer(mitosis);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
