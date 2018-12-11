import {Address} from '../address/address';
import {IConnection} from '../connection/interface';
import {RemotePeer} from './remote-peer';

export class RoutingTable {

  private _peers: Array<RemotePeer>;

  constructor() {
    this._peers = [];
  }

  public connectTo(address: Address): Promise<IConnection> {
    let peer = this.getPeerById(address.getPeerId());

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

  public getPeerById(peerId: number): RemotePeer {
    return this.getPeers().find((p) => p.getId() === peerId);
  }
}
