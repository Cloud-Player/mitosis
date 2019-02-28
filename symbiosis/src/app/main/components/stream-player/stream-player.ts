import {HttpClient} from '@angular/common/http';
import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {IStreamChurnEvent, Mitosis} from 'mitosis';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-stream-player',
  templateUrl: './stream-player.html',
  styleUrls: ['./stream-player.scss'],
})
export class StreamPlayerComponent implements OnInit {

  private _currentChannelId: string;
  @Input()
  public mitosis: Mitosis;
  @ViewChild('video')
  public videoEl: ElementRef;

  public hasStream = false;

  constructor(private http: HttpClient) {
  }

  private setPoster() {
    // To not show glitch gifs during development
    if (environment.production) {
      this.http
        .get('https://api.giphy.com/v1/gifs/random?tag=glitch&api_key=7cLNzkQlip4qjmzXrzdgvuCx9gdnhOD2')
        .subscribe((resp: any) => {
          const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
          if (!videoEl.srcObject) {
            videoEl.poster = resp.data.image_url;
          }
        });
    }
  }

  private setStream(channelId: string, stream: MediaStream): void {
    const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
    this._currentChannelId = channelId;
    if (stream) {
      videoEl.srcObject = stream;
      videoEl.play();
    } else {
      this.hasStream = false;
      this.setPoster();
      videoEl.pause();
    }
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
    this.setPoster();

    const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
    videoEl.addEventListener('canplay', () => {
      this.hasStream = true;
    });
  }
}
