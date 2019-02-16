import {ConnectionState} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';
import {ConnectionTable} from '../../connection/connection-table';

export function removeSuperfluousConnections(mitosis: Mitosis): void {
  const directPeers = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  const directConnectionCount = directPeers
    .countConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
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
      )
      .sortByQuality()
      .slice(configuration.DIRECT_CONNECTIONS_MAX_GOAL)
      .forEach(connection => {
        Logger.getLogger(mitosis.getMyAddress().getId())
          .debug(`removing worst connection ${connection.getAddress().getId()}`, connection);
        connection.close();
      });
    if (closableConnections.length === 0) {
      Logger.getLogger(mitosis.getMyAddress().getId())
        .warn(`can not loose peers because no closable connection is available`);
    }
  }
}
