import {ConnectionState, IWebRTCStreamConnectionOptions, Protocol} from '../../connection/interface';
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
        const options: IWebRTCStreamConnectionOptions = {
          mitosisId: mitosis.getMyAddress().getId(),
          stream: mitosis.getStream()
        };
        mitosis
          .getPeerManager()
          .connectTo(address, options)
          .then(
            candidate => {
              Logger.getLogger(mitosis.getMyAddress().getId())
                .info(`pushing stream to ${candidate.getId()}`, candidate);
            }
          )
          .catch((err) => {
            Logger.getLogger(mitosis.getMyAddress().getId())
              .info(`can not open stream to ${peer.getId()}`, err);
          });
      }
    );
}
