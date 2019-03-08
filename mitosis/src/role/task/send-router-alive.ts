import {ConfigurationMap} from '../../configuration';
import {Address} from '../../message/address';
import {RouterAlive} from '../../message/router-alive';
import {Mitosis, RoleType} from '../../mitosis';
import {Router} from '../router';

export function sendRouterAlive(mitosis: Mitosis): void {
  const router: Router = mitosis
    .getRoleManager()
    .getRole(RoleType.ROUTER) as Router;

  if (!router) {
    return;
  }

  const sequenceNumber = router.nextSequenceNumber();

  mitosis.getPeerManager().sendMessage(new RouterAlive(
    mitosis.getMyAddress(),
    new Address(ConfigurationMap.getDefault().BROADCAST_ADDRESS),
    {sequence: sequenceNumber}
  ));
}
