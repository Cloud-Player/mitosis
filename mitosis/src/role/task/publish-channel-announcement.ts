import {ConnectionState} from '../../connection/interface';
import {Address} from '../../message/address';
import {ChannelAnnouncement} from '../../message/channel-announcement';
import {IChannelAnnouncement} from '../../message/interface';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function publishChannelAnnouncement(mitosis: Mitosis): void {
  const announcements: Array<IChannelAnnouncement> = mitosis
    .getStreamManager()
    .getChannelTable()
    .filter(
      channel => channel.isActive()
    )
    .map(
      channel => {
        const announcement = channel.getAnnouncement();
        announcement.providers.push(
          {
            peerId: mitosis.getMyAddress().getId(),
            capacity: mitosis.getStreamManager().getMyCapacity()
          }
        );
        return announcement;
      }
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
