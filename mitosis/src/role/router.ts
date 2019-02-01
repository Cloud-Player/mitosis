import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {sendAlternatives} from './task/send-alternatives';
import {sendRouterAlive} from './task/send-router-alive';

export class Router implements IRole {
  private sequenceNumber = 1;

  public onTick(mitosis: Mitosis): void {
    sendRouterAlive(mitosis, this.sequenceNumber++);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    sendAlternatives(mitosis, message);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
