import {ConnectionState} from '../../connection/interface';
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
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  signalsAndRouters
    .forEach(peer => {
      peer.getConnectionTable()
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
        .forEach(
          connection => {
            const peerUpdate = new PeerUpdate(
              mitosis.getMyAddress(),
              connection.getAddress(),
              signalsAndRouters
            );
            connection.send(peerUpdate);
          });
    });
}
