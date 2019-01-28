import {Configuration} from '../configuration';
import {ConnectionState} from '../connection/interface';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {Mitosis, RemotePeer, RoleType} from '../mitosis';
import {PeerManager} from '../peer/peer-manager';
import {IRole} from './interface';

export class Router implements IRole {

  private sendAlternativesAsPeerUpdate(peerManager: PeerManager, message: Message) {
    const directPeers = peerManager
      .getPeerTable()
      .filterConnection(
        table => table
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
      );

    if (directPeers.length < Configuration.DIRECT_CONNECTIONS_MAX) {
      // No need to send alternatives because we still have capacity.
      return;
    }

    const senderIsDirect = peerManager
      .getPeerById(message.getSender().getId())
      .getConnectionTable()
      .filterDirect()
      .length;

    if (senderIsDirect) {
      // No need to send alternatives because peer role will do that for direct connections.
      return;
    }

    if (message.getReceiver().getId() !== peerManager.getMyId()) {
      throw new Error('i shouldn\'t answer to this');
    }

    const alternativePeers = directPeers
      .sortByQuality()
      .asArray()
      .slice(0, Configuration.ROUTER_REDIRECT_ALTERNATIVE_COUNT);

    const tableUpdate = new PeerUpdate(
      message.getReceiver(),
      message.getSender(),
      alternativePeers
    );
    peerManager.sendMessage(tableUpdate);
  }

  public onTick(mitosis: Mitosis): void {
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
    if (message.getSubject() === MessageSubject.CONNECTION_NEGOTIATION) {
      this.sendAlternativesAsPeerUpdate(mitosis.getPeerManager(), message);
    }
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return remotePeer.hasRole(RoleType.SIGNAL);
  }
}
