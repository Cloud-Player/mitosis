import {ConnectionState, IConnection} from '../connection/interface';
import {RemotePeer} from '../mesh/remote-peer';
import {Address} from './address';
import {IRoutingTableUpdateEntry, MessageSubject} from './interface';
import {Message} from './message';

export class PeerUpdate extends Message {
  protected _body: Array<IRoutingTableUpdateEntry>;

  public constructor(sender: Address, receiver: Address, remotePeers: Array<RemotePeer>) {
    const body: Array<IRoutingTableUpdateEntry> = [];
    remotePeers.forEach(remotePeer => {
      const connection: IConnection = remotePeer.getConnectionTable()
        .filterByStates(ConnectionState.OPEN)
        .sortByQuality()
        .shift();
      if (connection) {
        body.push({peerId: remotePeer.getId(), roles: remotePeer.getRoles(), quality: connection.getQuality()});
      }
    });
    super(sender, receiver, MessageSubject.PEER_UPDATE, body);
  }

  public getBody(): Array<IRoutingTableUpdateEntry> {
    return this._body;
  }
}
