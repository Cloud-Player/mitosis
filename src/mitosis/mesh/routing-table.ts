import {IConnection} from '../connection/interface';
import {Address} from './address';
import {Peer} from './peer';

export class RoutingTable {

  private _peers: Array<Peer>;

  constructor() {
    this._peers = [];
  }

  public connectTo(address: Address): Promise<IConnection> {
    let peer = this.getPeerById(address.getPeerId());

    if (peer) {
      return Promise.resolve(peer.getBestConnection());
    } else {
      peer = new Peer(this);
      this._peers.push(peer);
      return peer.connect(address);
    }
  }

  public getPeers(): Array<Peer> {
    return this._peers;
  }

  public getPeerById(peerId: number): Peer {
    return this.getPeers().find((p) => p.getId() === peerId);
  }
}
