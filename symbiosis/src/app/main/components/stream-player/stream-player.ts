import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {IStreamChurnEvent, Mitosis} from 'mitosis';

@Component({
  selector: 'app-stream-player',
  templateUrl: './stream-player.html',
  styleUrls: ['./stream-player.scss'],
})
export class StreamPlayerComponent implements OnInit {

  @Input()
  public mitosis: Mitosis;
  @ViewChild('video')
  public videoEl: ElementRef;
  private _currentChannelId: string;

  private setStream(channelId: string, stream: MediaStream): void {
    const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
    this._currentChannelId = channelId;
    videoEl.srcObject = stream;
  }

  ngOnInit(): void {
    setInterval(
      () => {
        const newChannel = this.mitosis
          .getStreamManager()
          .getChannelTable()
          .filter(
            channel => {
              return channel.isActive() && channel.getId() !== this._currentChannelId;
            }
          )
          .asArray()
          .sort(
            () => .5 - Math.random()
          )
          .pop();
        if (newChannel) {
          this.setStream(newChannel.getId(), newChannel.getMediaStream());
        }
      },
      5000
    );
    this.mitosis
      .getStreamManager()
      .observeStreamChurn()
      .subscribe(
        (ev: IStreamChurnEvent) => {
          this.setStream(ev.channelId, ev.stream);
        }
      );
  }
}
