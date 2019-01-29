import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {IClock} from '../clock/interface';
import {Configuration} from '../configuration';
import {IConnectionOptions, IViaConnectionOptions, Protocol} from '../connection/interface';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {RoleManager} from '../role/role-manager';
import {IPeerChurnEvent} from './interface';
import {RemotePeer} from './remote-peer';
import {RemotePeerTable} from './remote-peer-table';

export class PeerManager {

  private _myId: string;
  private _roleManager: RoleManager;
  private _clock: IClock;
  private _peers: Array<RemotePeer>;
  private _peerChurnSubject: Subject<IPeerChurnEvent>;

  constructor(myId: string, roleManager: RoleManager, clock: IClock) {
    this._myId = myId;
    this._roleManager = roleManager;
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

    const directPeers = this.getPeerTable()
      .filterConnection(
        table => table.filterDirect()
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
        Logger.getLogger(this._myId)
          .warn(`cannot open connection to ${address.toString()}`, reason);
        return Promise.reject(reason);
      });
  }

  public connectToVia(remotePeerId: string, viaPeerId: string, options?: IConnectionOptions): Promise<RemotePeer> {
    const viaAddress = new Address(
      remotePeerId,
      Protocol.VIA,
      viaPeerId
    );
    const remotePeer = this.getPeerById(viaPeerId);
    if (remotePeer) {
      options.payload.parent = remotePeer
        .getConnectionTable()
        .filterDirect()
        .shift();
      return this.connectTo(viaAddress, options as IViaConnectionOptions);
    } else {
      return Promise.reject(
        `cannot connect to ${remotePeerId} because via ${viaPeerId} is missing`);
    }
  }

  public sendMessage(message: Message) {
    const existingPeer = this.getPeerById(message.getReceiver().getId());
    if (existingPeer) {
      existingPeer.send(message);
    } else {
      Logger.getLogger(this._myId)
        .error(`cannot send message because ${message.getReceiver().toString()} has left`);
    }
  }

  public getPeerTable(): RemotePeerTable {
    return new RemotePeerTable(this._peers);
  }

  public getPeerById(id: string): RemotePeer {
    return this._peers.find(p => p.getId() === id);
  }

  public removePeer(remotePeer: RemotePeer): boolean {
    const rolesRequiringPeer = this._roleManager.getRolesRequiringPeer(remotePeer);
    Logger.getLogger(this._myId)
      .info(`${remotePeer.getId()} is required by ${rolesRequiringPeer.join(' and ') || 'nobody'}`);
    if (rolesRequiringPeer.length === 0) {
      const index = this._peers.indexOf(remotePeer);
      if (index > -1) {
        this._peers.splice(index, 1);
        remotePeer.destroy();
        return true;
      }
    }
    return false;
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
