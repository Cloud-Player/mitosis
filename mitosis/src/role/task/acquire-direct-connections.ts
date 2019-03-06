import {ConnectionState, Protocol} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {Mitosis} from '../../mitosis';
import {RemotePeer} from '../../peer/remote-peer';
import {RoleType} from '../interface';

export function acquireDirectConnections(mitosis: Mitosis): void {
  const peerTable = mitosis
    .getPeerManager()
    .getPeerTable();

  const directPeers = peerTable
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  const viaPeers = peerTable
    .filterConnections(
      table => table.filterByProtocol(Protocol.VIA)
    )
    .exclude(
      table => {
        return table
          .filterConnections(
            connectionTable => connectionTable.filterDirectData()
          );
      }
    )
    .exclude(
      table => table
        .filterByRole(RoleType.SIGNAL)
    );

  const directConnectionCount = directPeers
    .countConnections(
      table => table.filterDirect()
    );
  const configuration = mitosis.getRoleManager().getConfiguration();
  const insufficientConnections = configuration.DIRECT_CONNECTIONS_MIN_GOAL - directConnectionCount;

  if (insufficientConnections > 0 && viaPeers.length > 0) {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      `need to acquire ${insufficientConnections} peers`
    );
    viaPeers
      .sortBy((peer: RemotePeer) =>
        peer.getMeter().getRouterAliveQuality() * peer.getMeter().getAverageConnectionQuality()
      )
      .slice(0, insufficientConnections)
      .forEach(
        remotePeer => {
          const address = new Address(remotePeer.getId(), Protocol.WEBRTC_DATA);
          Logger.getLogger(mitosis.getMyAddress().getId())
            .debug(`connecting to ${remotePeer.getId()} with quality ${remotePeer.getMeter().getQuality()}`, remotePeer);
          mitosis
            .getPeerManager()
            .connectTo(address)
            .catch(
              error => Logger
                .getLogger(mitosis.getMyAddress().getId())
                .warn(`connection to ${address} failed`, error)
            );
        }
      );
  }
}
