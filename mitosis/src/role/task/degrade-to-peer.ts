import {Logger} from '../../logger/logger';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function degradeToPeer(mitosis: Mitosis): void {
  const roleManager = mitosis.getRoleManager();

  const noSignal = mitosis.getPeerTable().filterByRole(RoleType.SIGNAL).length === 0;
  if (roleManager.hasRole(RoleType.ROUTER) && noSignal) {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug('lost signal connection');
    roleManager.removeRole(RoleType.ROUTER);
  }
}
