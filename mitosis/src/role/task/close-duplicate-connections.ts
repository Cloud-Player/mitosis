import {ConnectionState, Protocol} from '../../connection/interface';
import {Mitosis} from '../../mitosis';

export function closeDuplicateConnections(mitosis: Mitosis): void {
  mitosis
    .getPeerTable()
    .forEach(
      remotePeer => {
        const direct = remotePeer
          .getConnectionTable()
          .filterDirect()
          .filterByStates(ConnectionState.OPEN);
        if (direct.length <= 1) {
          return;
        }
        Object.values(Protocol)
          .forEach(
            protocol => {
              direct
                .filter(
                  connection => connection.getAddress().isProtocol(protocol)
                )
                .sortBy(
                  connection => connection.getAddress().getLocation()
                )
                .slice(1)
                .forEach(
                  connection => connection.close()
                );
            }
          );
      }
    );
}
