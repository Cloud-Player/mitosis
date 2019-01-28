import {ConnectionState} from '../connection/interface';
import {Configuration} from '../configuration';
import {PeerManager} from '../peer/peer-manager';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {Mitosis} from '../mitosis';
import {IRole, RoleType} from './interface';

export class Router implements IRole {

  private getAlternatives(peerManager: PeerManager, count: number = 5) {
    return peerManager
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

  private sendAlternativesAsPeerUpdate(peerManager: PeerManager, message: Message) {
    const directPeerCount = peerManager
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

    const tableUpdate = new PeerUpdate(
      message.getReceiver(),
      message.getSender(),
      this.getAlternatives(peerManager)
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
}
