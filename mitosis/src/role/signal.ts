import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {RoleUpdate} from '../message/role-update';
import {Address, ConnectionState, MessageSubject, Mitosis, RemotePeer, RoleType} from '../mitosis';
import {IRole} from './interface';

export class Signal implements IRole {

  public onTick(mitosis: Mitosis): void {
  }

  private getRouters(mitosis: Mitosis) {
    return mitosis.getRoutingTable()
      .getPeers()
      .filter(
        peer => {
          return peer.hasRole(RoleType.ROUTER) &&
            peer.getConnectionTable()
              .filterDirect()
              .filterByStates(ConnectionState.OPEN)
              .length;
        }
      );
  }

  private promoteNewbie(newbieAddress: Address, routers: Array<RemotePeer>, mitosis: Mitosis) {
    const existingPeer = mitosis.getRoutingTable()
      .getPeers()
      .find(peer => peer.getId() === newbieAddress.getId());

    const roles = [RoleType.PEER];
    if (routers.length === 0) {
      existingPeer.getRoles().push(RoleType.ROUTER);
      routers.push(existingPeer);
      roles.push(RoleType.ROUTER);
    }
    const roleUpdate = new RoleUpdate(
      mitosis.getMyAddress(),
      newbieAddress,
      roles
    );
    mitosis.getRoutingTable().sendMessage(roleUpdate);
  }

  private sendExistingRouters(address: Address, routers: Array<RemotePeer>, mitosis: Mitosis) {
    const tableUpdate = new PeerUpdate(
      mitosis.getMyAddress(),
      address,
      routers
    );
    mitosis.getRoutingTable().sendMessage(tableUpdate);
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
    const sender = message.getSender();
    const routers = this.getRouters(mitosis);
    const senderIsRouter = routers.find(peer => peer.getId() === sender.getId());

    if (!senderIsRouter && message.getSubject() === MessageSubject.INTRODUCTION) {
      this.promoteNewbie(sender, routers, mitosis);
      this.sendExistingRouters(sender, routers, mitosis);
    } else if (senderIsRouter && message.getSubject() === MessageSubject.PEER_UPDATE) {
      this.sendExistingRouters(sender, routers, mitosis);
    }
  }
}
