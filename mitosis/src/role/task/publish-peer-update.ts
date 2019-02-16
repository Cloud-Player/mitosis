import {ConnectionState} from '../../connection/interface';
import {PeerUpdate} from '../../message/peer-update';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function publishPeerUpdate(mitosis: Mitosis): void {
  const directPeers = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterByRole(RoleType.PEER)
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  directPeers
    .forEach(peer => {
      const bestConnection =
        peer.getConnectionTable()
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
          .sortByQuality()
          .pop();

      if (bestConnection) {
        const peerUpdate = new PeerUpdate(
          mitosis.getMyAddress(),
          bestConnection.getAddress(),
          directPeers
        );
        bestConnection.send(peerUpdate);
      }
    });
}
