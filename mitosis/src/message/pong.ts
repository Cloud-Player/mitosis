import {RemotePeer} from '../peer/remote-peer';
import {RoleType} from '../role/interface';
import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export class Pong extends Message {
  protected _body: number;

  public constructor(sender: Address, receiver: Address, sequence: number) {
    super(sender, receiver, MessageSubject.PONG, sequence);
  }

  public getBody(): number {
    return this._body;
  }
}
