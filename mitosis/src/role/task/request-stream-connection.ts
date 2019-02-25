import {Address} from '../../message/address';
import {ConnectionNegotiationType} from '../../message/connection-negotiation';
import {MessageSubject} from '../../message/interface';
import {Message} from '../../message/message';
import {Mitosis, Protocol} from '../../mitosis';

export function requestStreamConnection(mitosis: Mitosis): void {
  const activelyStreaming = mitosis
    .getStreamManager()
    .getChannelTable()
    .has(
      channel => channel.isActive()
    );

  if (activelyStreaming) {
    return;
  }

  mitosis
    .getStreamManager()
    .getChannelTable()
    .map(
      channel => channel
        .getProviderTable()
        .filter(
          provider => provider.getCapacity() > 0
        )
        .map(
          provider => {
            return {peerId: provider.getPeerId(), channelId: channel.getId()};
          }
        )
    )
    .reduce(
      (previous, current) => previous.concat(current), []
    )
    .forEach(
      (interest: { peerId: string, channelId: string }) => {
        const request = new Message(
          new Address(mitosis.getMyAddress().getId(), Protocol.WEBRTC_STREAM),
          new Address(interest.peerId),
          MessageSubject.CONNECTION_NEGOTIATION,
          {
            type: ConnectionNegotiationType.REQUEST,
            channelId: interest.channelId
          }
        );
        mitosis.getPeerManager().sendMessage(request);
      }
    );
}
