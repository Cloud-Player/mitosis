import {ConnectionState} from '../../connection/interface';
import {PeerUpdate} from '../../message/peer-update';
import {Mitosis} from '../../mitosis';

export function publishPeerUpdate(mitosis: Mitosis): void {
  const directPeers = mitosis.getPeerManager().getPeers()
    .filter(remotePeer => {
      return remotePeer.getConnectionTable()
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
        .length !== 0;
    });
  directPeers.forEach(remotePeer => {
    remotePeer.getConnectionTable()
      .filterDirect()
      .filterByStates(ConnectionState.OPEN)
      .asArray()
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
