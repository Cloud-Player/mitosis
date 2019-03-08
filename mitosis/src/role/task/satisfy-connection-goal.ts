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

  const acquisitionGoal = (
    configuration.DIRECT_CONNECTIONS_GOAL_MIN - directConnectionCount + mitosis.getPeerManager().getAcquisitionBoost()
  );

  if (acquisitionGoal > 0) {
    Logger.getLogger(mitosis.getMyAddress().getId())
      .debug(`need to acquire ${acquisitionGoal} peers`
      );
    const promises = acquireDirectConnections(mitosis, acquisitionGoal);
    Promise.all(promises)
      .catch(
        reason =>
          Logger.getLogger(mitosis.getMyAddress().getId())
            .warn('could not satisfy connection goal', reason)
      );
  }
}
