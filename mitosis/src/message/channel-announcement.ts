import {Address} from './address';
import {IChannelAnnouncementBody, MessageSubject} from './interface';
import {Message} from './message';

export class ChannelAnnouncement extends Message {

  protected _body: IChannelAnnouncementBody;

  public constructor(sender: Address, receiver: Address, body: IChannelAnnouncementBody) {
    super(sender, receiver, MessageSubject.CHANNEL_ANNOUNCEMENT, body);
  }

  public getBody(): IChannelAnnouncementBody {
    return this._body;
  }
}
