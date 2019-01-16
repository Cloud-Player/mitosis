import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {IClock} from '../clock/interface';
import {IConnectionOptions} from '../connection/interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {Configuration} from './configuration';
import {ChurnType, IPeerChurnEvent} from './interface';
import {RemotePeer} from './remote-peer';

export class RoutingTable {

  private _clock: IClock;
  private _peerChurnSubject: Subject<IPeerChurnEvent>;
  private _peers: Array<RemotePeer>;
  private _myId: string;

  constructor(myId: string, clock: IClock) {
    this._myId = myId;
    this._clock = clock;
    this._peers = [];
    this._peerChurnSubject = new Subject();
  }

  private listenOnConnectionRemoved(remotePeer: RemotePeer): void {
    if (remotePeer.getConnectionTable().length === 0) {
      this.removePeer(remotePeer);
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
      peer = new RemotePeer(address.getId(), this._myId, this._clock.fork());
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
    return this._peers.find(p => p.getId() === id);
  }

  public removePeer(remotePeer: RemotePeer): void {
    const index = this._peers.indexOf(remotePeer);
    if (index > -1) {
      this._peers.splice(index, 1);
      remotePeer.destroy();
    }
  }

  public observePeerChurn(): Subject<IPeerChurnEvent> {
    return this._peerChurnSubject;
  }

  public toString() {
    return JSON.stringify({
        count: this._peers.length,
        remotePeers: this._peers
      },
      undefined,
      2
    );
  }

  public destroy(): void {
    this._peerChurnSubject.complete();
    this._peers.forEach(remotePeer => this.removePeer(remotePeer));
    this._clock.stop();
  }
}
