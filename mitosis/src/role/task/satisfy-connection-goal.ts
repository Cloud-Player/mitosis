import {Configuration} from '../../configuration';
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
    .filterConnection(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  const viaPeers = peerTable
    .filterConnection(
      table => table.filterVia()
    )
    .exclude(
      table => table
        .filterConnection(
          connectionTable => connectionTable.filterDirect()
        )
    )
    .exclude(
      table => table
        .filterByRole(RoleType.SIGNAL)
    );

  const directConnectionCount = directPeers.countDirectConnections();
  const insufficientConnections = directConnectionCount < Configuration.DIRECT_CONNECTIONS_GOAL;
  const superfluousConnections = directConnectionCount > Configuration.DIRECT_CONNECTIONS_GOAL;

  if (insufficientConnections) {
    if (viaPeers.length) {
      Logger.getLogger(mitosis.getMyAddress().getId()).debug(
        `need to acquire ${Configuration.DIRECT_CONNECTIONS_GOAL - directConnectionCount} peers`
      );
      const bestViaPeer = viaPeers
        .sortByQuality()
        .shift();
      const address = new Address(bestViaPeer.getId(), Protocol.WEBRTC_DATA);
      mitosis.getPeerManager().connectTo(address);
    } else {
      // No indirect peers to connect to: do nothing
    }
  } else if (superfluousConnections) {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      `need to loose ${directConnectionCount - Configuration.DIRECT_CONNECTIONS_GOAL} peers`
    );
    const worstDirectPeers = directPeers
      .exclude(
        table => table.filterIsProtected(true)
      )
      .sortByQuality();
    while (worstDirectPeers.length) {
      const worstDirectPeer = worstDirectPeers.pop();
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
