import {ConfigurationMap} from '../../configuration';
import {Address} from '../../message/address';
import {RouterAlive} from '../../message/router-alive';
import {Mitosis} from '../../mitosis';

export function sendRouterAlive(mitosis: Mitosis, sequenceNumber: number): void {
  mitosis.getPeerManager().sendMessage(new RouterAlive(
    mitosis.getMyAddress(),
    new Address(ConfigurationMap.getDefault().BROADCAST_ADDRESS),
    {sequence: sequenceNumber}
  ));
}
