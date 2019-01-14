import {Configuration} from '../mesh/configuration';
import {RoutingTable} from '../mesh/routing-table';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {ConnectionState, MessageSubject, Mitosis, RoleType} from '../mitosis';
import {IRole} from './interface';

export class Router implements IRole {

  private getAlternatives(routingTable: RoutingTable, count: number = 5) {
    return routingTable
      .getPeers()
      .filter(
        peer => {
          return peer.getConnectionTable()
            .filterDirect()
            .filterByStates(ConnectionState.OPEN)
            .length;
        }
      )
      .sort(
        (a, b) => {
          return a.getConnectionTable().getAverageQuality() -
            b.getConnectionTable().getAverageQuality();
        }
      )
      .slice(0, count);
  }

  private sendAlternativesAsPeerUpdate(routingTable: RoutingTable, message: Message) {
    const directPeerCount = routingTable
      .getPeers()
      .filter(
        remotePeer => {
          return remotePeer.hasRole(RoleType.PEER) &&
            remotePeer.getConnectionTable().filterDirect().length;
        }
      ).length;

    if (directPeerCount < Configuration.DIRECT_CONNECTIONS_MAX) {
      // No need to send alternatives because we still have capacity.
      return;
    }

    const senderIsDirect = routingTable
      .getPeerById(message.getSender().getId())
      .getConnectionTable()
      .filterDirect()
      .length;

    if (senderIsDirect) {
      // No need to send alternatives because peer role will do that for direct connections.
      return;
    }

    if (message.getReceiver().getId() !== routingTable.getMyId()) {
      throw new Error('i shouldn\'t answer to this');
    }

    const tableUpdate = new PeerUpdate(
      message.getReceiver(),
      message.getSender(),
      this.getAlternatives(routingTable)
    );
    routingTable.sendMessage(tableUpdate);
  }

  public onTick(mitosis: Mitosis): void {
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
    if (message.getSubject() === MessageSubject.CONNECTION_NEGOTIATION) {
      this.sendAlternativesAsPeerUpdate(mitosis.getRoutingTable(), message);
    }
  }
}
