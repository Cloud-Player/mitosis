import {ConnectionState} from '../../connection/interface';
import {MessageSubject} from '../../message/interface';
import {Message} from '../../message/message';
import {Mitosis} from '../../mitosis';

export function sendAlternatives(mitosis: Mitosis, message: Message) {
  const configuration = mitosis.getRoleManager().getConfiguration();

  const peerManager = mitosis.getPeerManager();
  if (message.getSubject() !== MessageSubject.CONNECTION_NEGOTIATION ||
    message.getReceiver().getId() !== peerManager.getMyId()) {
    return;
  }

  const directConnections = peerManager
    .getPeerTable()
    .countConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
    );

  if (directConnections >= configuration.DIRECT_CONNECTIONS_MAX) {
    peerManager
      .getPeerTable()
      .filterById(message.getSender().getId())
      .exclude(
        table => table.filterConnections(
          peer => peer
            .filterDirectData()
            .filterByStates(ConnectionState.OPEN)
        )
      )
      .forEach(
        peer => peerManager.sendPeerSuggestion(peer.getId())
      );
  }
}
