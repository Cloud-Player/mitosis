import {ConnectionState, Protocol} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function satisfyConnectionGoal(mitosis: Mitosis): void {
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
            connectionTable => connectionTable.filterDirect()
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
  const insufficientConnections = directConnectionCount < configuration.DIRECT_CONNECTIONS_MIN_GOAL;
  const superfluousConnections = directConnectionCount > configuration.DIRECT_CONNECTIONS_MAX_GOAL;

  if (insufficientConnections) {
    if (viaPeers.length) {
      Logger.getLogger(mitosis.getMyAddress().getId()).debug(
        `need to acquire ${configuration.DIRECT_CONNECTIONS_MIN_GOAL - directConnectionCount} peers`
      );
      const bestViaPeer = viaPeers
        .sortByQuality()
        .pop();
      const address = new Address(bestViaPeer.getId(), Protocol.WEBRTC_DATA);
      Logger.getLogger(mitosis.getMyAddress().getId())
        .debug(`connecting to best peer ${bestViaPeer.getId()} with quality ${bestViaPeer.getMeter().getQuality()}`);
      mitosis.getPeerManager().connectTo(address);
    } else {
      // No indirect peers to connect to: do nothing
    }
  } else if (superfluousConnections) {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      `need to loose ${directConnectionCount - configuration.DIRECT_CONNECTIONS_MAX_GOAL} peers`
    );
    const worstDirectPeers = directPeers
      .exclude(
        table => table.filterIsProtected(true)
      )
      .sortByQuality();
    while (worstDirectPeers.length) {
      const worstDirectPeer = worstDirectPeers.shift();
      const success = mitosis
        .getPeerManager()
        .removePeer(worstDirectPeer);
      if (success) {
        Logger.getLogger(mitosis.getMyAddress().getId()).debug(`removing worst peer ${worstDirectPeer.getId()}`, worstDirectPeer);
        break;
      }
    }
  } else {
    // Connection goal reached: do nothing
  }
}
