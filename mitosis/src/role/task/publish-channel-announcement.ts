import {ConnectionState} from '../../connection/interface';
import {ChannelAnnouncement} from '../../message/channel-announcement';
import {Address, Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function publishChannelAnnouncement(mitosis: Mitosis): void {
  const announcements = mitosis
    .getStreamManager()
    .getChannelTable()
    .filter(
      channel => channel.isActive()
    )
    .map(
      channel => channel.getAnnouncement()
    );

  if (announcements.length === 0) {
    return;
  }

  const directPeers = mitosis
    .getPeerManager()
    .getPeerTable()
    .filterByRole(RoleType.PEER)
    .filterConnections(
      table => table
        .filterDirect()
        .filterByStates(ConnectionState.OPEN)
    );

  directPeers
    .forEach(peer => {
      const channelAnnouncement = new ChannelAnnouncement(
        mitosis.getMyAddress(),
        new Address(peer.getId()),
        announcements
      );
      mitosis.getPeerManager().sendMessage(channelAnnouncement);
    });
}
