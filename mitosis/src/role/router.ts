import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {AbstractRole} from './role';
import {degradeToPeer} from './task/degrade-to-peer';
import {publishSignalAndRouterUpdate} from './task/publish-signal-and-router-update';
import {sendRouterAlive} from './task/send-router-alive';

export class Router extends AbstractRole implements IRole {

  private sequenceNumber = 1;

  protected onTick(mitosis: Mitosis): void {
    publishSignalAndRouterUpdate(mitosis);
    sendRouterAlive(mitosis, this.sequenceNumber++);
    degradeToPeer(mitosis);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
