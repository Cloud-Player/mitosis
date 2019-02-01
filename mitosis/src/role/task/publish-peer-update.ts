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
      peer.getConnectionTable()
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
        .forEach(
          connection => {
            const peerUpdate = new PeerUpdate(
              mitosis.getMyAddress(),
              connection.getAddress(),
              directPeers
            );
            connection.send(peerUpdate);
          });
    });
}
