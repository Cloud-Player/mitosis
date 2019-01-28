import {ConnectionTable} from '../../connection/connection-table';
import {ConnectionState, IConnection, Protocol} from '../../connection/interface';
import {Configuration} from '../../configuration';
import {RemotePeer} from '../../peer/remote-peer';
import {Address} from '../../message/address';
import {Mitosis} from '../../mitosis';

export function satisfyConnectionGoal(mitosis: Mitosis): void {
  const directConnections: Array<IConnection> = [];
  const indirectPeers: Array<RemotePeer> = [];

  const peersRankedByQuality = mitosis.getPeerManager().getPeers()
    .sort((a, b) => {
      return b.getConnectionTable().getAverageQuality() - a.getConnectionTable().getAverageQuality();
    });

  peersRankedByQuality.map(
    peer => {
      const connectionTable = peer.getConnectionTable()
        .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
        .filterDirect();
      if (connectionTable.length) {
        directConnections.push(...connectionTable.asArray());
      } else {
        indirectPeers.push(peer);
      }
    }
  );

  const insufficientConnections = directConnections.length < Configuration.DIRECT_CONNECTIONS_GOAL;

  if (insufficientConnections && indirectPeers.length) {
    const address = new Address(indirectPeers.shift().getId(), Protocol.WEBRTC_DATA);
    mitosis.getPeerManager().connectTo(address);
  } else if (directConnections.length > Configuration.DIRECT_CONNECTIONS_GOAL) {
    const worstConnection = new ConnectionTable(directConnections)
      .sortByQuality()
      .pop();
    if (worstConnection.getState() !== ConnectionState.OPENING) {
      worstConnection.close();
    }
  }
}
