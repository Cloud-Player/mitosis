import {HttpClient} from '@angular/common/http';
import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Mitosis} from 'mitosis';
import {StreamService} from '../../services/stream';

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

  public hasStream = false;
  public title = [
    'awaiting signal',
    'locating peers',
    'joining network',
    'loading assets',
    'observing churn',
    'acquiring connection',
    'weaving mesh'
  ].sort(() => 0.5 - Math.random())[0];

  constructor(private http: HttpClient, private streamService: StreamService) {
  }

  private setStream(stream: MediaStream): void {
    const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
    if (stream) {
      videoEl.srcObject = stream;
      videoEl.play();
    } else {
      this.hasStream = false;
      this.setPoster();
      videoEl.pause();
    }
  }

  private setPoster() {
    this.http
      .get('https://api.giphy.com/v1/gifs/random?tag=glitch&api_key=7cLNzkQlip4qjmzXrzdgvuCx9gdnhOD2')
      .subscribe((resp: any) => {
        const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
        if (!videoEl.srcObject) {
          videoEl.poster = resp.data.image_url;
        }
      });
  }


  ngOnInit(): void {
    if (this.streamService.getStream()) {
      this.setStream(this.streamService.getStream());
    } else {
      this.setPoster();
    }
    (this.videoEl.nativeElement as HTMLVideoElement)
      .addEventListener('canplay', () => {
        this.hasStream = true;
      });
    this.streamService
      .observe()
      .subscribe(
        (stream: MediaStream) => this.setStream(stream)
      );
  }
}
