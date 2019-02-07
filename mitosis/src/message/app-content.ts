import {RoleType} from '../role/interface';
import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export class AppContent extends Message {
  protected _body: Array<RoleType>;

  public constructor(sender: Address, receiver: Address, message: string) {
    super(sender, receiver, MessageSubject.APP_CONTENT, message);
  }

  public getBody(): Array<RoleType> {
    return this._body;
  }
}
