import {Message} from '../message/message';
import {IConnection, Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {degradeToPeer} from './task/degrade-to-peer';
import {publishSignalAndRouterUpdate} from './task/publish-signal-and-router-update';
import {sendRouterAlive} from './task/send-router-alive';

export class Router implements IRole {
  private sequenceNumber = 1;

  public onTick(mitosis: Mitosis): void {
    publishSignalAndRouterUpdate(mitosis);
    sendRouterAlive(mitosis, this.sequenceNumber++);
    degradeToPeer(mitosis);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }

  public onConnectionClose(mitosis: Mitosis, connection: IConnection): void {
  }

  public onConnectionOpen(mitosis: Mitosis, connection: IConnection): void {
  }
}
