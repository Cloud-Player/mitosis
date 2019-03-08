import {ConnectionState} from '../../connection/interface';
import {Mitosis} from '../../mitosis';
import {looseDirectConnections} from './loose-direct-connections';

export function removeSuperfluousConnections(mitosis: Mitosis): void {
  const configuration = mitosis.getRoleManager().getConfiguration();

  const directConnectionCount = mitosis
    .getPeerManager()
    .getPeerTable()
    .countConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
    );

  const superfluousConnectionCount = directConnectionCount - configuration.DIRECT_CONNECTIONS_GOAL_MAX;

  looseDirectConnections(mitosis, superfluousConnectionCount);
}
