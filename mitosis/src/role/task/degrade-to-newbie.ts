import {Logger, Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function degradeToNewbie(mitosis: Mitosis): void {
  const roleManager = mitosis.getRoleManager();

  if (!roleManager.hasRole(RoleType.NEWBIE) && mitosis.getPeerTable().length === 0) {
    Logger.getLogger(mitosis.getMyAddress().getId())
      .debug('lost all connections');
    roleManager
      .getRoles()
      .forEach(
        roleType => roleManager.removeRole(roleType)
      );
    roleManager.addRole(RoleType.NEWBIE);
  }
}
