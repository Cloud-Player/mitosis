import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function degradeToNewbie(mitosis: Mitosis): void {
  const roleManager = mitosis.getRoleManager();

  if (roleManager.hasRole(RoleType.NEWBIE)) {
    return;
  } else if (mitosis.getPeerTable().length === 0) {
    roleManager
      .getRoles()
      .forEach(
        roleType => roleManager.removeRole(roleType)
      );
    roleManager.addRole(RoleType.NEWBIE);
  }
}
