import {RemotePeer} from '../mesh/remote-peer';
import {RoleType} from '../role/interface';
import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export class AppContent extends Message {
  protected _body: Array<RoleType>;

  public constructor(sender: Address, receiver: Address, roles: Array<RemotePeer>) {
    super(sender, receiver, MessageSubject.APP_CONTENT, roles);
  }

  public getBody(): Array<RoleType> {
    return this._body;
  }
}
