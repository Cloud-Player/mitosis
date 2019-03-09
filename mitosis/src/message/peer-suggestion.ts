import {RemotePeer} from '../peer/remote-peer';
import {RemotePeerTable} from '../peer/remote-peer-table';
import {Address} from './address';
import {IPeerUpdateEntry, MessageSubject} from './interface';
import {Message} from './message';

export class PeerSuggestion extends Message {
  protected _body: Array<IPeerUpdateEntry>;

  public constructor(sender: Address, receiver: Address, remotePeers: RemotePeerTable, allRemotePeers: RemotePeerTable) {
    const body = remotePeers
      .map(
        (peer: RemotePeer) => {
          return {
            peerId: peer.getId(),
            roles: peer.getRoles(),
            quality: peer.getMeter().getPeerUpdateQuality(allRemotePeers)
          };
        })
      .sort(
        (entry: IPeerUpdateEntry) => entry.quality
      )
      .reverse()
      .slice(0, 5);
    super(sender, receiver, MessageSubject.PEER_SUGGESTION, body);
  }

  public getBody(): Array<IPeerUpdateEntry> {
    return this._body;
  }
}
