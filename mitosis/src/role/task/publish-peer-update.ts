import {ConnectionState} from '../../connection/interface';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function publishPeerUpdate(mitosis: Mitosis): void {
  mitosis
    .getPeerManager()
    .getPeerTable()
    .filterByRole(RoleType.PEER)
    .filterConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
    )
    .forEach(peer => mitosis
      .getPeerManager()
      .sendPeerUpdate(peer.getId())
    );
}
