import {ConnectionState, IConnection, Protocol} from '../../connection/interface';
import {WebRTCStreamConnection} from '../../connection/webrtc-stream';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {Mitosis} from '../../mitosis';

export function broadcastStream(mitosis: Mitosis, connection: IConnection): void {
  const inConnection = connection as WebRTCStreamConnection;
  if (!inConnection.isInitiator()) {
    const config = mitosis.getRoleManager().getConfiguration();
    const pushCandidates = mitosis
      .getPeerTable()
      .exclude(
        table =>
          table
            .filterById(connection.getAddress().getId())
      )
      .filterConnections(
        table =>
          table
            .filterDirect()
            .filterByStates(ConnectionState.OPEN)
      )
      .sortByQuality();
    pushCandidates
      .slice(0, config.OUTBOUND_STREAM_CONNECTIONS)
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
              candidate =>
                inConnection
                  .getStream()
                  .then(
                    inStream => {
                      const outConnection = (candidate.getConnectionForAddress(address) as WebRTCStreamConnection);
                      outConnection.setStream(inStream);
                      Logger.getLogger(mitosis.getMyAddress().getId())
                        .warn(`pushing stream to ${candidate.getId()}`, outConnection);
                    }
                  )
            )
            .catch(
              reason => Logger.getLogger(mitosis.getMyAddress().getId())
                .warn(`could not stream to ${peer.getId()}`, reason)
            );
        }
      );
  }
}
