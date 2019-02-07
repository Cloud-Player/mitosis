import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';

export function removeExpiredConnections(mitosis: Mitosis): void {
  mitosis.getPeerManager()
    .getPeerTable()
    .aggregateConnections(
      connectionTable => connectionTable
        .filterByMeter(meter => meter.isLastSeenExpired())
    )
    .forEach(
      connection => {
        Logger.getLogger(mitosis.getMyAddress().getId())
          .debug(`removing expired connection ${connection.getAddress().getId()}`, connection);
        connection.close();
      }
    );
}
