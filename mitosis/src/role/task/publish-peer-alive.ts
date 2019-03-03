import {ConnectionState, Protocol} from '../../connection/interface';
import {Address} from '../../message/address';
import {PeerAlive} from '../../message/peer-alive';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function publishPeerAlive(mitosis: Mitosis): void {
  if (mitosis.getRoleManager().hasRole(RoleType.ROUTER)) {
    return;
  }

  const routers = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterByRole(RoleType.ROUTER)
    .filterConnections(
      peerTable => peerTable
        .filterByStates(ConnectionState.OPEN)
    )
    .exclude(
      peerTable => peerTable
        .filterConnections(
          connectionTable => connectionTable
            .filterByProtocol(
              Protocol.VIA,
              Protocol.WEBRTC_DATA,
              Protocol.WEBSOCKET,
              Protocol.WEBSOCKET_UNSECURE
            )
          // Exclude direct and single-hop via routers
          // because they are reported by direct peers
          // of the router anyway.
        )
    );

  routers
    .forEach(
      router => mitosis
        .getPeerManager()
        .sendMessage(
          new PeerAlive(
            mitosis.getMyAddress(),
            new Address(router.getId())
          )
        ));
}
