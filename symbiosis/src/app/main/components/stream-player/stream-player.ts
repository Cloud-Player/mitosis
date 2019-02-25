import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {ChurnType, Mitosis} from 'mitosis';
import {filter} from 'rxjs/operators';

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
      .subscribe(channelEvent => {
        const channel = channelEvent.value;
        const videoEl = this.videoEl.nativeElement as HTMLVideoElement;
        if (channel.getActiveProvider()) {
          videoEl.srcObject = channel.getActiveProvider().getStream();
        }
        channel.observeProviderChurn()
          .pipe(
            filter(
              filterEv => filterEv.type === ChurnType.ADDED
            )
          )
          .subscribe((provider) => {
            videoEl.srcObject = channel.getActiveProvider().getStream();
          });
      });
  }
}
