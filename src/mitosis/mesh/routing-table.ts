import {IConnection} from '../connection/interface';
import {Address} from '../message/address';
import {RemotePeer} from './remote-peer';

export class RoutingTable {

  private _peers: Array<RemotePeer>;
  private _myId: string;

  constructor(myId: string) {
    this._myId = myId;
    this._peers = [];
  }

  public getMyId(): string {
    return this._myId;
  }

  public connectTo(address: Address): Promise<IConnection> {
    let peer = this.getPeerById(address.getIdentifier());
    if (peer) {
      return Promise.resolve(peer.getBestConnection());
    } else {
      peer = new RemotePeer(this);
      this._peers.push(peer);
      return peer.connect(address);
    }
  }

  public getPeers(): Array<RemotePeer> {
    return this._peers;
  }

  public getPeerById(id: string): RemotePeer {
    return this.getPeers().find(p => p.getId() === id);
  }
}
