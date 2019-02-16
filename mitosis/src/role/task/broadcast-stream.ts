import {ConnectionState, Protocol} from '../../connection/interface';
import {WebRTCStreamConnection} from '../../connection/webrtc-stream';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {Mitosis} from '../../mitosis';

export function broadcastStream(mitosis: Mitosis): void {
  const config = mitosis
    .getRoleManager()
    .getConfiguration();

  const pushCandidates = mitosis
    .getPeerTable()
    .exclude(
      table =>
        table
          .filterConnections(
            connections => connections.filterByProtocol(Protocol.WEBRTC_STREAM)
          )
    )
    .filterConnections(
      table =>
        table
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
    )
    .sortByQuality()
    .slice(0, config.OUTBOUND_STREAM_CONNECTIONS);

  pushCandidates
    .forEach(
      peer => {
        const address = new Address(
          peer.getId(),
          Protocol.WEBRTC_STREAM
        );
        mitosis
          .getPeerManager()
          .connectTo(address)
          .then(
            candidate => {
              const outConnection = (candidate.getConnectionForAddress(address) as WebRTCStreamConnection);
              outConnection.setStream(mitosis.getStream());
              Logger.getLogger(mitosis.getMyAddress().getId())
                .info(`pushing stream to ${candidate.getId()}`, outConnection);
            }
          )
          .catch((err) => {
            Logger.getLogger(mitosis.getMyAddress().getId())
              .info(`can not open stream to ${peer.getId()}`, err);
          });
      }
    );
}
