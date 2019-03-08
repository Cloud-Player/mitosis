import {ConnectionState} from '../../connection/interface';
import {Address} from '../../message/address';
import {PeerUpdate} from '../../message/peer-update';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function publishSignalAndRouterUpdate(mitosis: Mitosis): void {
  // This update is sent between signals and routers

  const signalsAndRouters = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterByRole(RoleType.SIGNAL, RoleType.ROUTER)
    .filterConnections(
      table => table
        .filterDirectData()
        .filterByStates(ConnectionState.OPEN)
    );

  signalsAndRouters
    .forEach(peer => mitosis
      .getPeerManager()
      .sendMessage(
        new PeerUpdate(
          mitosis.getMyAddress(),
          new Address(peer.getId()),
          signalsAndRouters
        )
      )
    );
}
