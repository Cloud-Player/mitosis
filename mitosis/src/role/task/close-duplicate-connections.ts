import {ConnectionState, Protocol} from '../../connection/interface';
import {Mitosis} from '../../mitosis';

export function closeDuplicateConnections(mitosis: Mitosis): void {
  mitosis
    .getPeerTable()
    .asArray()
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
                .filterConnection(
                  connection => connection.getAddress().getProtocol() === protocol
                )
                .asArray()
                .sort(
                  (a, b) => a.getAddress().getLocation().localeCompare(b.getAddress().getLocation())
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
