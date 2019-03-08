import {Protocol} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {Mitosis} from '../../mitosis';
import {RemotePeer} from '../../peer/remote-peer';
import {RoleType} from '../interface';

export function acquireDirectConnections(mitosis: Mitosis, count: number): Array<Promise<RemotePeer>> {
  if (count < 1) {
    return [];
  }

  const peerTable = mitosis
    .getPeerManager()
    .getPeerTable();

  const viaPeers = peerTable
    .filterConnections(
      table => table.filterByProtocol(Protocol.VIA)
    )
    .filterByRole(RoleType.PEER)
    .exclude(
      table => table
        .filterConnections(
          connectionTable => connectionTable.filterDirectData()
        )
    );

  return viaPeers
    .sortBy(
      (peer: RemotePeer) =>
        peer.getMeter().getAcquisitionQuality(peerTable)
    )
    .reverse()
    .slice(0, count)
    .map(
      (peer: RemotePeer) => {
        const address = new Address(peer.getId(), Protocol.WEBRTC_DATA);
        Logger.getLogger(mitosis.getMyAddress().getId())
          .debug(`connecting to ${peer.getId()} with quality ${peer.getMeter().getQuality()}`, peer);
        return mitosis
          .getPeerManager()
          .connectTo(address);
      }
    );
}
