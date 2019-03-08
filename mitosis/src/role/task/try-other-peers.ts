import {Address, ConnectionState, Logger, Mitosis, Protocol, RemotePeer, RoleType} from '../../mitosis';

export function tryOtherPeers(mitosis: Mitosis): void {
  if (mitosis.getClock().getTick() % 5 === 0) {
    const configuration = mitosis.getRoleManager().getConfiguration();

    const peerTable = mitosis
      .getPeerManager()
      .getPeerTable();

    const directConnections = peerTable
      .aggregateConnections(
        connectionTable => connectionTable
          .filterDirectData()
          .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
      );

    const viaPeers = peerTable
      .filterConnections(
        table => table.filterByProtocol(Protocol.VIA)
      )
      .filterByRole(RoleType.PEER)
      .exclude(
        table => {
          return table
            .filterConnections(
              connectionTable => connectionTable.filterDirectData()
            );
        }
      );

    const directConnectionAmount = directConnections.length;
    const tryConnectionAmount = directConnections.length - configuration.DIRECT_CONNECTIONS_MAX_GOAL;

    if (tryConnectionAmount > 0) {
      viaPeers
        .sortBy((peer: RemotePeer) =>
          peer.getMeter().getRouterLinkQuality() * peer.getMeter().getAverageConnectionQuality()
        )
        .slice(0, tryConnectionAmount)
        .forEach(
          remotePeer => {
            const address = new Address(remotePeer.getId(), Protocol.WEBRTC_DATA);
            Logger.getLogger(mitosis.getMyAddress().getId())
              .debug(`connecting to ${remotePeer.getId()} with quality ${remotePeer.getMeter().getQuality()}`, remotePeer);
            mitosis
              .getPeerManager()
              .connectTo(address)
              .then(() => {
                const newDirectConnectionAmount = peerTable
                  .countConnections(
                    connectionTable => connectionTable
                      .filterDirectData()
                      .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
                  );
                if (newDirectConnectionAmount > directConnectionAmount) {
                  // TODO CLOSE WORST DIRECT CONNECTION
                }
              });
          }
        );
    }
  }
}
