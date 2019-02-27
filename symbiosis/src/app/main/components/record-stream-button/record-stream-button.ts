import {Component, Input} from '@angular/core';
import {Mitosis} from 'mitosis';

@Component({
  selector: 'app-record-stream-button',
  templateUrl: './record-stream-button.html',
  styleUrls: ['./record-stream-button.scss'],
})
export class RecordStreamButtonComponent {
  @Input()
  public mitosis: Mitosis;

  @Input()
  public mini: boolean;

  public startStream(): void {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then(
      (stream: MediaStream) => {
        this.mitosis.getStreamManager().setLocalStream(stream);
      });
  }

  public getButtonType(): string {
    if (this.mini) {
      return 'fab-mini';
    } else {
      return 'fab';
    }
  }

  public stopStream(): void {
    this.mitosis.getStreamManager().unsetLocalStream();
  }

  public hasLocalStream(): boolean {
    return !!this.mitosis.getStreamManager().getLocalStream();
  }

  public countActiveStreams(): number {
    return this.mitosis
      .getStreamManager()
      .getChannelTable()
      .count(
        channel => channel.isActive()
      );
  }

  public canShowRecordButton() {
    return !this.hasLocalStream() && this.countActiveStreams() < 3;
  }
}
