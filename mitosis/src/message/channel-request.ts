import {Address} from './address';
import {MessageSubject} from './interface';
import {Message} from './message';

export class ChannelRequest extends Message {

  protected _body: string;

  public constructor(sender: Address, receiver: Address, streamId: string) {
    super(sender, receiver, MessageSubject.CHANNEL_REQUEST, streamId);
  }

  public getBody(): string {
    return this._body;
  }
}
