import {RemotePeer} from '../mesh/remote-peer';
import {RoleType} from '../role/interface';
import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export class Pong extends Message {
  protected _body: Array<RoleType>;

  public constructor(sender: Address, receiver: Address) {
    super(sender, receiver, MessageSubject.PONG, null);
  }

  public getBody(): Array<RoleType> {
    return this._body;
  }
}
