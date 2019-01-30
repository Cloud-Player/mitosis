import {ConnectionState} from '../../connection/interface';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function removeSignal(mitosis: Mitosis): void {
  const peerTable = mitosis
    .getPeerManager()
    .getPeerTable();

  const signals = peerTable
    .filterByRole(RoleType.SIGNAL)
    .filterConnection(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  if (signals.length === 0) {
    return;
  }

  const routers = peerTable
    .filterByRole(RoleType.ROUTER)
    .filterConnection(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );
  if (routers.length === 0) {
    return;
  }

  signals
    .asArray()
    .forEach(
      signal => signal.destroy()
    );
}
