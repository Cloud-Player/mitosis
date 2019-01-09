import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {IConnectionOptions} from '../connection/interface';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {ChurnType, IPeerChurnEvent} from './interface';
import {RemotePeer} from './remote-peer';

export class RoutingTable {

  private _peerChurnSubject: Subject<IPeerChurnEvent>;
  private _peers: Array<RemotePeer>;
  private _myId: string;

  constructor(myId: string) {
    this._myId = myId;
    this._peers = [];
    this._peerChurnSubject = new Subject();
  }

  private listenOnConnectionRemoved(remotePeer: RemotePeer): void {
    if (remotePeer.getConnectionTable().length === 0) {
      this._peers = this._peers.filter(
        peer => peer.getId() !== remotePeer.getId()
      );
    }
  }

  public getMyId(): string {
    return this._myId;
  }

  public connectTo(address: Address, options?: IConnectionOptions): Promise<RemotePeer> {
    let peer = this.getPeerById(address.getId());
    if (peer && peer.getConnectionForAddress(address)) {
      return Promise.resolve(peer);
    }

    if (!peer) {
      peer = new RemotePeer(address.getId(), this._myId);
      this._peers.push(peer);
      peer.observeChurn()
        .pipe(
          filter(ev => ev.type === ChurnType.REMOVED)
        )
        .subscribe(
          ev => this.listenOnConnectionRemoved(peer)
        );
      this._peerChurnSubject.next({peer: peer, type: ChurnType.ADDED});
    }

    return peer.connect(address, options)
      .then(() => {
        return peer;
      })
      .catch(() => {
        console.warn(`${this.getMyId()} can not open connection to peer ${peer.getId()}`);
        return Promise.reject(peer);
      });
  }

  public sendMessage(message: Message) {
    const existingPeer = this.getPeerById(message.getReceiver().getId());
    if (existingPeer) {
      existingPeer.send(message);
    } else {
      console.error(`cannot send message because ${message.getReceiver().toString()} does not exist`);
    }
  }

  public getPeers(): Array<RemotePeer> {
    return this._peers;
  }

  public getPeerById(id: string): RemotePeer {
    return this.getPeers().find(p => p.getId() === id);
  }

  public observePeerChurn(): Subject<IPeerChurnEvent> {
    return this._peerChurnSubject;
  }

  public destroy(): void {
    this._peers.forEach(
      peer => peer.getConnectionTable().asArray().forEach(
        connection => connection.close()
      )
    );
  }
}
