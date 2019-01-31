import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function ensureRouterConnection(mitosis: Mitosis): void {
  if (mitosis.getRoleManager().hasRole(RoleType.ROUTER)) {
    return;
  }

  const routerConnectionCount = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterByRole(RoleType.ROUTER)
    .countConnections();

  if (routerConnectionCount === 0) {
    Logger.getLogger(mitosis.getMyAddress().getId())
      .debug('lost all connections to router');
    mitosis.getRoleManager().addRole(RoleType.NEWBIE);
  }
}
