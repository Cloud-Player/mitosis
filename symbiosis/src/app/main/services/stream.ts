import {Injectable} from '@angular/core';
import {Channel, ChurnType, Mitosis} from 'mitosis';
import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';

@Injectable()
export class StreamService {

  private _mitosis: Mitosis;
  private _currentStream: MediaStream;
  private _currentChannel: Channel;
  private _streamSubject = new Subject<MediaStream>();

  public setMitosis(mitosis: Mitosis): void {
    this._mitosis = mitosis;
    this._mitosis
      .getStreamManager()
      .observeChannelChurn()
      .pipe(
        filter(channelEv => channelEv.type === ChurnType.ADDED)
      )
      .subscribe(
        channelEv => {
          channelEv.value
            .observeStreamChurn()
            .pipe(
              filter(streamEv => streamEv.type === ChurnType.ADDED)
            )
            .subscribe(
              streamEv => {
                if (!this.getStream()) {
                  this.update(channelEv.value, streamEv.stream);
                }
              }
            );
          channelEv.value
            .observeStreamChurn()
            .pipe(
              filter(streamEv => streamEv.type === ChurnType.REMOVED)
            )
            .subscribe(
              streamEv => {
                if (streamEv.stream === this._currentStream) {
                  this.switchChannel();
                }
              }
            );
        }
      );
  }

  public getOtherChannels(): Array<Channel> {
    return this._mitosis
      .getStreamManager()
      .getChannelTable()
      .filter(
        channel => {
          if (!channel.isActive()) {
            return false;
          }
          return channel.getId() !== this.getChannelId();
        }
      )
      .asArray();
  }

  public switchChannel(): void {
    const channel = this.getOtherChannels()
      .sort(
        () => 0.5 - Math.random()
      )
      .pop();
    if (channel) {
      const stream = channel.getMediaStream();
      this.update(channel, stream);
      return;
    }
    if (this.getChannel() && this.getChannel().isActive()) {
      return;
    }
    this.update(null, null);
  }

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
