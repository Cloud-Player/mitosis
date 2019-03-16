import {Component, Input} from '@angular/core';
import {Channel, Mitosis} from 'mitosis';
import {StreamService} from '../../services/stream';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.html',
  styleUrls: ['./controls.scss'],
})
export class ControlsComponent {

  @Input()
  public mitosis: Mitosis;

  @Input()
  public mini: boolean;

  constructor(private streamService: StreamService) {
  }

  public getButtonType(): string {
    if (this.mini) {
      return 'fab-mini';
    } else {
      return 'fab';
    }
  }

  public showStartButton(): boolean {
    return !this.showStopButton() && this.streamService.getOtherChannels().length <= 3;
  }

  public startStream(): void {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then(
      (stream: MediaStream) => {
        const manager = this.mitosis.getStreamManager();
        manager.setLocalStream(stream);
        this.streamService.setChannel(manager.getLocalChannel());
        this.streamService.setStream(stream);
      });
  }

  public showStopButton(): boolean {
    return !!this.mitosis.getStreamManager().getLocalStream();
  }

  public stopStream(): void {
    this.mitosis.getStreamManager().unsetLocalStream();
  }

  public showSwitchButton(): boolean {
    return this.streamService.getOtherChannels().length > 0;
  }

  public switchStream(): void {
    this.streamService.switchChannel();
  }
}
