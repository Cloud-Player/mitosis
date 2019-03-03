import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export class PeerAlive extends Message {
  protected _body: null;

  public constructor(sender: Address, receiver: Address) {
    super(sender, receiver, MessageSubject.PEER_ALIVE, null);
  }

  public getBody(): null {
    return this._body;
  }
}
