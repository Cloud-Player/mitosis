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

  private getOtherChannels(): Array<Channel> {
    return this.mitosis
      .getStreamManager()
      .getChannelTable()
      .filter(
        channel => {
          if (!channel.isActive()) {
            return false;
          }
          return channel.getId() !== this.streamService.getChannelId();
        }
      )
      .asArray();
  }

  public getButtonType(): string {
    if (this.mini) {
      return 'fab-mini';
    } else {
      return 'fab';
    }
  }

  public showStartButton(): boolean {
    return !this.showStopButton() && this.getOtherChannels().length <= 3;
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
    return this.getOtherChannels().length > 0;
  }

  public switchStream(): void {
    const channel = this.getOtherChannels()
      .sort(
        () => 0.5 - Math.random()
      )
      .pop();
    if (channel) {
      const stream = channel.getMediaStream();
      this.streamService.update(channel, stream);
    }
  }
}
