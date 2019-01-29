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
        'GOAL insufficient connections', viaPeers, directConnectionCount
      );
      const bestViaPeer = viaPeers
        .sortByQuality()
        .shift();
      const address = new Address(bestViaPeer.getId(), Protocol.WEBRTC_DATA);
      mitosis.getPeerManager().connectTo(address);
    } else {
      Logger.getLogger(mitosis.getMyAddress().getId()).debug(
        'GOAL no indirect peers', peerTable, directConnectionCount
      );
    }
  } else if (superfluousConnections) {
    const worstDirectPeers = directPeers.sortByQuality();

    while (worstDirectPeers.length) {
      const worstDirectPeer = worstDirectPeers.pop();
      const success = mitosis
        .getPeerManager()
        .removePeer(worstDirectPeer);
      if (success) {
        Logger.getLogger(mitosis.getMyAddress().getId()).debug(
          'GOAL kicking worst peer', worstDirectPeer, directConnectionCount
        );
        break;
      }
    }
  } else {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      'GOAL i am satisfied', directConnectionCount
    );
  }
}
