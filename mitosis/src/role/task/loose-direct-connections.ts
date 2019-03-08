import {ConnectionState, IConnection, Logger, Mitosis} from '../../mitosis';

export function looseDirectConnections(mitosis: Mitosis, count: number): void {
  if (count < 1) {
    return;
  }

  const configuration = mitosis.getRoleManager().getConfiguration();

  const maxGoal = configuration.DIRECT_CONNECTIONS_MAX_GOAL;
  const minGoal = configuration.DIRECT_CONNECTIONS_MIN_GOAL;

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

  let closablePeers = directPeers
    .filter(
      remotePeer => mitosis
        .getRoleManager()
        .getRolesRequiringPeer(remotePeer).length === 0
    )
    .filterIsProtected(false);

  const bestRouterLink = directPeers
    .filter(
      remotePeer => remotePeer.getMeter().getRouterLinkQuality() === 1
    )
    .pop();

  if (bestRouterLink) {
    closablePeers = closablePeers
      .filter(
        remotePeer => remotePeer.getId() !== bestRouterLink.getId()
      );
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

  const overMinGoal = Math.max(closableConnections.length - minGoal, 0);
  const overMaxGoal = Math.max(directConnections.length - maxGoal, 0);
  const safeClosableConnectionCount = Math.min(overMinGoal, overMaxGoal, count);

  if (safeClosableConnectionCount > 0) {
    closableConnections
      .slice(0, safeClosableConnectionCount)
      .forEach(
        (connection: IConnection) => {
          Logger.getLogger(mitosis.getMyAddress().getId())
            .debug(`loosing worst connection ${connection.getAddress().getId()}`, connection);
          connection.close();
        }
      );
  } else {
    Logger.getLogger(mitosis.getMyAddress().getId())
      .warn(`can not loose peers because no closable connection is available`);
  }
}
