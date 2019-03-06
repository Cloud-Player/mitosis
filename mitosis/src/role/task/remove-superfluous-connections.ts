import {ConnectionState} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';

export function removeSuperfluousConnections(mitosis: Mitosis): void {
  const configuration = mitosis.getRoleManager().getConfiguration();
  const directPeers = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
    );

  const directConnections = directPeers
    .aggregateConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
    );
  const protectedConnections = directConnections.filterByMeter(meter => meter.isProtected());
  const unprotectedConnectionCount = directConnections.length - protectedConnections.length;
  const superfluousConnectionCount = unprotectedConnectionCount - configuration.DIRECT_CONNECTIONS_MAX_GOAL;
  const overflowConnectionCount = directConnections.length - configuration.DIRECT_CONNECTIONS_MAX;

  let closablePeers = directPeers
    .filter(
      remotePeer => mitosis
        .getRoleManager()
        .getRolesRequiringPeer(remotePeer).length === 0
    );

  const bestRouterLink = directPeers
    .filter(
      remotePeer => remotePeer.getMeter().getRouterAliveQuality() === 1
    )
    .pop();

  if (bestRouterLink) {
    closablePeers = closablePeers
      .filter(
        remotePeer => remotePeer.getId() !== bestRouterLink.getId()
      );
  }

  if (superfluousConnectionCount > 0) {
    closablePeers = closablePeers.filterIsProtected(false);

    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      `should loose ${superfluousConnectionCount} peers`,
      `not closing my best router link ${bestRouterLink}`,
      `can disconnect ${closablePeers.length} peers`
    );
  } else if (overflowConnectionCount > 0) {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      `must loose ${superfluousConnectionCount} peers`,
      `not closing my best router link ${bestRouterLink}`,
      `can disconnect ${closablePeers.length} peers`
    );
  } else {
    return;
  }

  const closableConnections = closablePeers
    .aggregateConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
    )
    .sortBy(
      connection => {
        if (connection.getMeter().isProtected()) {
          return 1.0;
        } else {
          return connection.getMeter().getQuality();
        }
      }
    );

  if (closableConnections.length > 0) {
    const closeConnection = closableConnections.shift();
    Logger.getLogger(mitosis.getMyAddress().getId())
      .debug(`removing worst connection ${closeConnection.getAddress().getId()}`, closeConnection);
    closeConnection.close();
  } else {
    Logger.getLogger(mitosis.getMyAddress().getId())
      .warn(`can not loose peers because no closable connection is available`);
  }
}
