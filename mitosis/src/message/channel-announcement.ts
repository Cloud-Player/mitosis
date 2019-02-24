import {Address} from './address';
import {IChannelAnnouncement, MessageSubject} from './interface';
import {Message} from './message';

export class ChannelAnnouncement extends Message {

  protected _body: Array<IChannelAnnouncement>;

  public constructor(sender: Address, receiver: Address, body: Array<IChannelAnnouncement>) {
    super(sender, receiver, MessageSubject.CHANNEL_ANNOUNCEMENT, body);
  }

  public getBody(): Array<IChannelAnnouncement> {
    return this._body;
  }
}
