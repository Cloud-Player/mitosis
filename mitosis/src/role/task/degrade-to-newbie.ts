import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function degradeToNewbie(mitosis: Mitosis): void {
  const roleManager = mitosis.getRoleManager();

  if (roleManager.hasRole(RoleType.ROUTER, RoleType.NEWBIE)) {
    return;
  }

  const routerConnectionCount = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterByRole(RoleType.ROUTER)
    .countConnections();

  if (routerConnectionCount === 0) {
    Logger.getLogger(mitosis.getMyAddress().getId())
      .info('lost all connections to router, becoming a newbie again');

    roleManager
      .getRoles()
      .forEach(
        roleType => roleManager.removeRole(roleType)
      );
    roleManager.addRole(RoleType.NEWBIE);

    mitosis
      .getPeerManager()
      .getPeerTable()
      .forEach(
        remotePeer => remotePeer.getMeter().getRouterAliveHighScore().reset()
      );


  }
}
