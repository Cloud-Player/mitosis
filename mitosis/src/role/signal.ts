import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {RoleUpdate} from '../message/role-update';
import {ConnectionState, MessageSubject, Mitosis, RoleType} from '../mitosis';
import {IRole} from './interface';

export class Signal implements IRole {

  public onTick(mitosis: Mitosis): void {
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
    if (message.getSubject() === MessageSubject.PEER_UPDATE) {
      const senderId = message.getSender().getId();
      const sender = mitosis.getRoutingTable().getPeerById(senderId);

      const routers = mitosis.getRoutingTable()
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

      if (!routers.includes(sender)) {
        const roles = [RoleType.PEER];
        if (!routers.length) {
          const newRouter = mitosis.getRoutingTable()
            .getPeers()
            .find(
              peer => peer.getId() === senderId
            );
          newRouter.getRoles().push(RoleType.ROUTER);
          routers.push(newRouter);
          roles.push(RoleType.ROUTER);
        }
        const roleUpdate = new RoleUpdate(
          mitosis.getMyAddress(),
          message.getSender(),
          roles
        );
        mitosis.getRoutingTable().sendMessage(roleUpdate);
      }

      const tableUpdate = new PeerUpdate(
        message.getReceiver(),
        message.getSender(),
        routers
      );
      mitosis.getRoutingTable().sendMessage(tableUpdate);
    }
  }
}
