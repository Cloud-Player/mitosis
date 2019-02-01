import {Configuration} from '../../configuration';
import {ConnectionState} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {RouterAlive} from '../../message/router-alive';
import {Mitosis} from '../../mitosis';

export function sendRouterAlive(mitosis: Mitosis, sequenceNumber: number): void {
  mitosis.getPeerManager().sendMessage(new RouterAlive(
    mitosis.getMyAddress(),
    new Address(Configuration.BROADCAST_ADDRESS),
    {sequence: sequenceNumber}
  ));
}
