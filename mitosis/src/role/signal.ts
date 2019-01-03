import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {RoleUpdate} from '../message/role-update';
import {Mitosis} from '../mitosis';
import {IRole, RoleType} from './interface';

export class Signal implements IRole {

  public onTick(mitosis: Mitosis): void {
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    const routers = mitosis.getRoutingTable().getPeers().filter(
      peer => peer.hasRole(RoleType.ROUTER)
    );
    const tableUpdate = new PeerUpdate(
      mitosis.getMyAddress(),
      message.getSender(),
      routers
    );
    mitosis.getRoutingTable().sendMessage(tableUpdate);

    const roleUpdate = new RoleUpdate(
      mitosis.getMyAddress(),
      message.getSender(),
      [RoleType.PEER]
    );
    mitosis.getRoutingTable().sendMessage(roleUpdate);
  }
}
