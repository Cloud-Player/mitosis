import {ConnectionState} from '../connection/interface';
import {RemotePeerTable} from '../peer/remote-peer-table';
import {Address} from './address';
import {IPeerUpdateEntry, MessageSubject} from './interface';
import {Message} from './message';

export class UnknownPeer extends Message {
  protected _body: string;

  public constructor(sender: Address, receiver: Address, remotePeerId: string) {
    super(sender, receiver, MessageSubject.UNKNOWN_PEER, remotePeerId);
  }

  public getBody(): string {
    return this._body;
  }
}
