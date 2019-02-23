import {ConnectionTable} from '../../connection/connection-table';
import {ConnectionState, Protocol} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';

export function removeSuperfluousConnections(mitosis: Mitosis): void {
  const directPeers = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
        .exclude(
          excludeTable =>
            excludeTable.filterByProtocol(Protocol.WEBRTC_STREAM)
        )
    );

  const directConnectionCount = directPeers
    .countConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
        .exclude(
          excludeTable =>
            excludeTable.filterByProtocol(Protocol.WEBRTC_STREAM)
        )
    );

  const configuration = mitosis.getRoleManager().getConfiguration();
  const superfluousConnections = directConnectionCount > configuration.DIRECT_CONNECTIONS_MAX_GOAL;

  if (superfluousConnections) {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      `need to loose ${directConnectionCount - configuration.DIRECT_CONNECTIONS_MAX_GOAL} peers`
    );
    const closableConnections: ConnectionTable = directPeers
      .filter(
        remotePeer => mitosis
          .getRoleManager()
          .getRolesRequiringPeer(remotePeer).length === 0
      )
      .filterIsProtected(false)
      .aggregateConnections(
        table => table
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
          .exclude(
            excludeTable =>
              excludeTable.filterByProtocol(Protocol.WEBRTC_STREAM)
          )
      )
      .sortByQuality();

    if (closableConnections.length > 0) {
      const closeConnection = closableConnections.pop();
      Logger.getLogger(mitosis.getMyAddress().getId())
        .debug(`removing worst connection ${closeConnection.getAddress().getId()}`, closeConnection);
      closeConnection.close();
    } else {
      Logger.getLogger(mitosis.getMyAddress().getId())
        .warn(`can not loose peers because no closable connection is available`);
    }
  }
}
