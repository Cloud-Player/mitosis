import {ConnectionState, IConnection} from '../connection/interface';
import {RemotePeerTable} from '../peer/remote-peer-table';
import {Address} from './address';
import {IPeerUpdateEntry, MessageSubject} from './interface';
import {Message} from './message';

export class PeerUpdate extends Message {
  protected _body: Array<IPeerUpdateEntry>;

  public constructor(sender: Address, receiver: Address, remotePeers: RemotePeerTable) {
    const body: Array<IPeerUpdateEntry> = [];
    remotePeers.forEach(remotePeer => {
      const connection: IConnection = remotePeer.getConnectionTable()
        .filterByStates(ConnectionState.OPEN)
        .sortByQuality()
        .shift();
      if (connection) {
        body.push(
          {
            peerId: remotePeer.getId(),
            roles: remotePeer.getRoles(),
            quality: connection.getMeter().getQuality()
          });
      }
    });
    super(sender, receiver, MessageSubject.PEER_UPDATE, body);
  }

  public getBody(): Array<IPeerUpdateEntry> {
    return this._body;
  }
}
