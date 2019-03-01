import {ConnectionState} from '../../connection/interface';
import {Logger} from '../../logger/logger';
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

  if (mitosis.getRoleManager().hasRole(RoleType.NEWBIE)) {
    return;
  }

  const routers = peerTable
    .filterByRole(RoleType.ROUTER);

  const directConnections = peerTable
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  // When it does not have a router yet or less than 2 connections, meaning it is only connected via signal, do not remove
  // TODO: Make this threshold configurable
  if (routers.length === 0 || directConnections.length < 2) {
    return;
  }

  Logger.getLogger(mitosis.getMyAddress().getId())
    .info('close connection so signal', `routers: ${routers.length}, connections: ${directConnections.length}`);

  signals
    .forEach(
      signal => signal.destroy()
    );
}
