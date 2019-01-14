import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {IConnectionOptions} from '../connection/interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {Configuration} from './configuration';
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
    const index = this._peers.indexOf(remotePeer);
    if (remotePeer.getConnectionTable().length === 0 && index > -1) {
      this._peers.splice(index, 1);
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

    const directPeers = this.getPeers()
      .filter(
        remotePeer => remotePeer.getConnectionTable().filterDirect().length > 0
      );
    if (directPeers.length >= Configuration.DIRECT_CONNECTIONS_MAX) {
      Logger.getLogger(this._myId).warn(`max direct connections reached ${address.toString()}`);
      return Promise.reject(peer);
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
      .catch(reason => {
        Logger.getLogger(this._myId).warn(`cannot open connection to ${address.toString()}`, reason);
        return Promise.reject(reason);
      });
  }

  public sendMessage(message: Message) {
    const existingPeer = this.getPeerById(message.getReceiver().getId());
    if (existingPeer) {
      existingPeer.send(message);
    } else {
      Logger.getLogger(this._myId).error(`cannot send message because ${message.getReceiver().toString()} has left`);
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
