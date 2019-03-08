import {ConnectionState, Logger, Mitosis} from '../../mitosis';
import {acquireDirectConnections} from './acquire-direct-connections';
import {looseDirectConnections} from './loose-direct-connections';

export function tryOtherPeers(mitosis: Mitosis): void {
  const configuration = mitosis.getRoleManager().getConfiguration();

  const peerTable = mitosis
    .getPeerManager()
    .getPeerTable();

  const directConnections = peerTable
    .aggregateConnections(
      connectionTable => connectionTable
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
    );

  const directConnectionCount = directConnections.length;
  const openingConnectionCount = directConnections
    .filterByStates(ConnectionState.OPENING)
    .length;

  if (
    directConnectionCount < configuration.DIRECT_CONNECTIONS_GOAL_MIN ||
    openingConnectionCount > 0
  ) {
    return;
  }

  const acquisitionGoal = Math.min(
    configuration.TRY_OTHER_PEERS_COUNT + mitosis.getPeerManager().getAcquisitionBoost(),
    configuration.DIRECT_CONNECTIONS_MAX - directConnectionCount
  );

  const promises = acquireDirectConnections(mitosis, acquisitionGoal);
  promises
    .forEach(
      promise => promise
        .then(() => {
          const newDirectConnectionCount = peerTable
            .countConnections(
              connectionTable => connectionTable
                .filterDirectData()
                .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
            );
          if (newDirectConnectionCount > directConnectionCount) {
            looseDirectConnections(mitosis, 1);
          }
        })
        .catch(
          reason =>
            Logger.getLogger(mitosis.getMyAddress().getId())
              .warn('could not try new peers', reason)
        )
    );
}
