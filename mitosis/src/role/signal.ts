import {ConnectionState} from '../connection/interface';
import {Address} from '../message/address';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {RoleUpdate} from '../message/role-update';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';

import {satisfyConnectionGoal} from './task/satisfy-connection-goal';

export class Signal implements IRole {

  public onTick(mitosis: Mitosis): void {
    satisfyConnectionGoal(mitosis);
  }

  private promoteToRoles(address: Address, roles: Array<RoleType>, mitosis: Mitosis): void {
    const existingPeer = mitosis
      .getPeerManager()
      .getPeerById(address.getId());

    existingPeer.setRoles(roles);

    const roleUpdate = new RoleUpdate(
      mitosis.getMyAddress(),
      address,
      roles
    );
    mitosis.getPeerManager().sendMessage(roleUpdate);
  }

  private sendExistingRouters(address: Address, routers: Array<RemotePeer>, mitosis: Mitosis): void {
    const tableUpdate = new PeerUpdate(
      mitosis.getMyAddress(),
      address,
      routers
    );
    mitosis.getPeerManager().sendMessage(tableUpdate);
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
    const sender = message.getSender();
    const routers = mitosis
      .getPeerManager()
      .getPeerTable()
      .filterByRole(RoleType.ROUTER)
      .filterConnection(
        table => table
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
      )
      .asArray();
    const senderIsRouter = routers.find(peer => peer.getId() === sender.getId());

    if (message.getSubject() === MessageSubject.INTRODUCTION) {
      if (senderIsRouter || routers.length === 0) {
        this.promoteToRoles(sender, [RoleType.PEER, RoleType.ROUTER], mitosis);
      } else {
        this.promoteToRoles(sender, [RoleType.PEER], mitosis);
      }
      this.sendExistingRouters(sender, routers, mitosis);
    }
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.ROUTER);
  }
}
