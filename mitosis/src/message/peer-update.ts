import {ConnectionState, IConnection} from '../connection/interface';
import {RemotePeer} from '../mesh/remote-peer';
import {RoleType} from '../role/interface';
import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export interface IRoutingTableUpdateEntry {
  peerId: string;
  roles: Array<RoleType>;
  quality: number;
}

export class PeerUpdate extends Message {
  protected _body: Array<IRoutingTableUpdateEntry>;

  public constructor(sender: Address, receiver: Address, remotePeers: Array<RemotePeer>) {
    const body: Array<IRoutingTableUpdateEntry> = [];
    remotePeers.forEach(remotePeer => {
      const connection: IConnection = remotePeer.getConnectionTable()
        .filterByStates(ConnectionState.OPEN)
        .sortByQuality()
        .shift();
      body.push({peerId: remotePeer.getId(), roles: remotePeer.getRoles(), quality: connection.getQuality()});
    });
    super(sender, receiver, MessageSubject.PEER_UPDATE, body);
  }

  public getBody(): Array<IRoutingTableUpdateEntry> {
    return this._body;
  }
}
