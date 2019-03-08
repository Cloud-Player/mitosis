import {ConnectionState} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';
import {acquireDirectConnections} from './acquire-direct-connections';

export function satisfyConnectionGoal(mitosis: Mitosis): void {
  const configuration = mitosis.getRoleManager().getConfiguration();

  const directConnectionCount = mitosis
    .getPeerManager()
    .getPeerTable()
    .countConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
    );

  const insufficientConnectionCount = configuration.DIRECT_CONNECTIONS_MIN_GOAL - directConnectionCount;

  if (insufficientConnectionCount > 0) {
    Logger.getLogger(mitosis.getMyAddress().getId())
      .debug(`need to acquire ${insufficientConnectionCount} peers`
      );
    const promises = acquireDirectConnections(mitosis, insufficientConnectionCount);
    Promise.all(promises)
      .catch(
        reason =>
          Logger.getLogger(mitosis.getMyAddress().getId())
            .warn('could not satisfy connection goal', reason)
      );
  }
}
