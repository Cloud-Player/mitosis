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

  const directConnectionCount = directPeers.countConnections();
  const insufficientConnections = directConnectionCount < Configuration.DIRECT_CONNECTIONS_GOAL;
  const superfluousConnections = directConnectionCount > Configuration.DIRECT_CONNECTIONS_GOAL;

  if (insufficientConnections) {
    if (viaPeers.length) {
      Logger.getLogger(mitosis.getMyAddress().getId()).debug(
        'insufficientConnections', viaPeers
      );
      const bestViaPeer = viaPeers
        .sortByQuality()
        .shift();
      const address = new Address(bestViaPeer.getId(), Protocol.WEBRTC_DATA);
      mitosis.getPeerManager().connectTo(address);
    } else {
      Logger.getLogger(mitosis.getMyAddress().getId()).debug(
        'no indirectPeers', peerTable
      );
    }
  } else if (superfluousConnections) {
    const worstDirectPeer = directPeers
      .sortByQuality()
      .pop();
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      'insufficientConnections', worstDirectPeer
    );
    mitosis
      .getPeerManager()
      .removePeer(worstDirectPeer);
  } else {
    Logger.getLogger(mitosis.getMyAddress().getId()).debug(
      'i am satisfied'
    );
  }
}
