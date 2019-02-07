import {Address} from './address';
import {IFloodableMessage, MessageSubject} from './interface';
import {Message} from './message';

export class RouterAlive extends Message implements IFloodableMessage {
  protected _body: { sequence: number };

  public constructor(sender: Address, receiver: Address, body: { sequence: number }) {
    super(sender, receiver, MessageSubject.ROUTER_ALIVE, null);
    this._body = body;
  }

  public getBody(): { sequence: number } {
    return this._body;
  }
}
