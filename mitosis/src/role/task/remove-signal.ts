import {ConnectionState} from '../../connection/interface';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function removeSignal(mitosis: Mitosis): void {
  if (mitosis.getRoleManager().hasRole(RoleType.ROUTER)) {
    // Do not abandon signal if we are router.
    return;
  }

  const peerTable = mitosis
    .getPeerManager()
    .getPeerTable();

  const signals = peerTable
    .filterByRole(RoleType.SIGNAL)
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  if (signals.length === 0) {
    return;
  }

  const routers = peerTable
    .filterByRole(RoleType.ROUTER)
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );
  if (routers.length === 0) {
    return;
  }

  signals
    .forEach(
      signal => signal.destroy()
    );
}
