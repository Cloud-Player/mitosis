import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export class Introduction extends Message {
  protected _body: null;

  public constructor(sender: Address, receiver: Address) {
    super(sender, receiver, MessageSubject.INTRODUCTION, null);
  }

  public getBody(): null {
    return this._body;
  }
}
