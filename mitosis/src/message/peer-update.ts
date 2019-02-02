import {ConnectionState} from '../connection/interface';
import {RemotePeerTable} from '../peer/remote-peer-table';
import {Address} from './address';
import {IPeerUpdateEntry, MessageSubject} from './interface';
import {Message} from './message';

export class PeerUpdate extends Message {
  protected _body: Array<IPeerUpdateEntry>;

  public constructor(sender: Address, receiver: Address, remotePeers: RemotePeerTable) {
    const body: Array<IPeerUpdateEntry> = [];
    remotePeers
      .filterConnections(
        connection => connection
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
      )
      .forEach(
        peer => {
          body.push({
            peerId: peer.getId(),
            roles: peer.getRoles(),
            quality: peer.getMeter().getPeerUpdateQuality(remotePeers)

          });
        });
    super(sender, receiver, MessageSubject.PEER_UPDATE, body);
  }

  public getBody(): Array<IPeerUpdateEntry> {
    return this._body;
  }
}
