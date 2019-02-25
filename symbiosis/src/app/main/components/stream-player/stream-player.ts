import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Mitosis} from 'mitosis';

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

  ngOnInit(): void {
    this.mitosis
      .getStreamManager()
      .observeStreamChurn()
      .subscribe(
        ev => {
          const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
          videoEl.srcObject = ev.stream;
        }
      );
  }
}
