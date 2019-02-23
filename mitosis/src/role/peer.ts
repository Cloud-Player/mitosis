import {Message} from '../message/message';
import {IConnection, Mitosis, Protocol, WebRTCStreamConnection} from '../mitosis';
import {IRole} from './interface';
import {AbstractRole} from './role';
import {acquireDirectConnections} from './task/acquire-direct-connections';
import {closeDuplicateConnections} from './task/close-duplicate-connections';
import {degradeToNewbie} from './task/degrade-to-newbie';
import {ensureRouterConnection} from './task/ensure-router-connection';
import {publishPeerUpdate} from './task/publish-peer-update';
import {removeExpiredConnections} from './task/remove-expired-connections';
import {removeSignal} from './task/remove-signal';
import {removeSuperfluousConnections} from './task/remove-superfluous-connections';
import {sendAlternatives} from './task/send-alternatives';

export class Peer extends AbstractRole implements IRole {

  protected onTick(mitosis: Mitosis): void {
    // Clean up connections
    closeDuplicateConnections(mitosis);
    removeExpiredConnections(mitosis);
    removeSignal(mitosis);
    removeSuperfluousConnections(mitosis);

    // Organize roles
    degradeToNewbie(mitosis);

    // Acquire connections
    acquireDirectConnections(mitosis);
    ensureRouterConnection(mitosis);

    // Publish
    publishPeerUpdate(mitosis);
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    sendAlternatives(mitosis, message);
  }
}
