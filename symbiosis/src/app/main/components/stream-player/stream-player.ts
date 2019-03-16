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

  private static _glitchURL = atob(
    'aHR0cHM6Ly9hcGkuZ2lwaHkuY29tL3YxL2dpZnMvcmFuZG9tP3RhZz1nbGl0Y2gmYXBpX2tleT03Y0xOemtRbGlwNHFqbXpYcnpkZ3Z1Q3g5Z2RuaE9EMg==');

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
    'weaving mesh',
    'allocating buffer',
    'chaining iterators',
    'linking routers',
    'preparing uplink',
    'ingesting downstream',
    'printing randomness'
  ].sort(() => 0.5 - Math.random())[0];

  constructor(private http: HttpClient,
              public streamService: StreamService) {
  }

  private setStream(stream: MediaStream): void {
    const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
    if (stream) {
      videoEl.srcObject = stream;
    } else {
      this.hasStream = false;
      this.setPoster();
      videoEl.pause();
      videoEl.srcObject = null;
    }
  }

  private setPoster() {
    this.http
      .get(StreamPlayerComponent._glitchURL)
      .subscribe((resp: any) => {
        const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
        if (!videoEl.srcObject) {
          videoEl.poster = resp.data.image_url;
        }
      });
  }

  ngOnInit(): void {
    this.streamService.setMitosis(this.mitosis);
    if (this.streamService.getStream()) {
      this.setStream(this.streamService.getStream());
    } else {
      this.setPoster();
    }
    const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
    videoEl.addEventListener('canplay', () => {
      this.hasStream = true;
      videoEl.play();
    });
    this.streamService
      .observe()
      .subscribe(
        (stream: MediaStream) => this.setStream(stream)
      );
  }
}
