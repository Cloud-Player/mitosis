import {Injectable} from '@angular/core';
import {Channel} from 'mitosis';
import {Subject} from 'rxjs';

@Injectable()
export class StreamService {

  private _currentStream: MediaStream;
  private _currentChannel: Channel;
  private _streamSubject = new Subject<MediaStream>();

  public getChannel(): Channel {
    return this._currentChannel;
  }

  public getChannelId(): string {
    if (this._currentChannel) {
      return this._currentChannel.getId();
    }
  }

  public setChannel(channel: Channel) {
    this._currentChannel = channel;
  }

  public getStream(): MediaStream {
    return this._currentStream;
  }

  public setStream(stream: MediaStream): void {
    this._currentStream = stream;
    this._streamSubject.next(stream);
  }

  public update(channel: Channel, stream: MediaStream): void {
    this.setChannel(channel);
    this.setStream(stream);
  }

  public observe(): Subject<MediaStream> {
    return this._streamSubject;
  }
}
