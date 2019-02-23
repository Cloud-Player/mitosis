import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {ChurnType, Mitosis} from 'mitosis';

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
      .observeChannelChurn()
      .subscribe(ev => {
        const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
        if (ev.type === ChurnType.ADDED) {
          videoEl.srcObject = ev.value.getMediaStream();
        } else if (ev.type === ChurnType.REMOVED) {
          videoEl.pause();
        }
      });
  }
}
