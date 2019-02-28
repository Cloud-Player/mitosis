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

  constructor(private streamService: StreamService) {
  }

  private setStream(stream: MediaStream): void {
    const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
    videoEl.srcObject = stream;
    videoEl.play();
  }

  ngOnInit(): void {
    if (this.streamService.getStream()) {
      this.setStream(this.streamService.getStream());
    }
    this.streamService.observe()
      .subscribe(
        (stream: MediaStream) => this.setStream(stream)
      );
  }
}
