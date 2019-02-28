import {Component, OnInit, ViewChild} from '@angular/core';
import {Channel, ChurnType, Logger, LogLevel, Mitosis} from 'mitosis';
import {FullscreenService} from '../../../shared/services/fullscreen';
import {StreamService} from '../../services/stream';
import {SidebarComponent} from '../sidebar/sidebar';

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.html',
  styleUrls: ['./messenger.scss'],
})
export class MessengerComponent implements OnInit {
  public mitosis: Mitosis;
  public selectedNode: Node;
  @ViewChild('sidebar')
  public sidebar: SidebarComponent;
  public inactiveTimer = 0;
  public isInactive = false;

  public infoVisible = false;

  constructor(private fullscreenService: FullscreenService, private streamService: StreamService) {
    Logger.setLevel(LogLevel.ERROR);
    this.mitosis = new Mitosis();
  }

  private setActive() {
    this.inactiveTimer = 0;
    this.isInactive = false;
  }

  private subscribeChannel(channel: Channel): void {
    channel
      .observeProviderChurn()
      .subscribe(
        providerEvent => {
          if (
            providerEvent.type === ChurnType.ADDED &&
            !this.streamService.getChannel() &&
            providerEvent.value.isActive() &&
            !providerEvent.value.isLocal()
          ) {
            // If nothing is playing, tune into new channel automatically
            this.streamService.update(channel, providerEvent.value.getStream());
            return;
          }
          if (
            providerEvent.type === ChurnType.REMOVED &&
            channel.getId() === this.streamService.getChannelId() &&
            !providerEvent.value.isActive()
          ) {
            if (channel.isActive()) {
              // If one provider for the channel we are watching is removed, switch to another
              this.streamService.setStream(channel.getMediaStream());
            } else {
              // If we loose our only provider for this channel, reset the stream service
              this.streamService.update(null, null);
            }
          }
        }
      );
  }

  private subscribeStreamService(): void {
    this.mitosis
      .getStreamManager()
      .observeChannelChurn()
      .subscribe(
        channelEvent => {
          if (channelEvent.type === ChurnType.ADDED) {
            this.subscribeChannel(channelEvent.value);
          } else if (channelEvent.type === ChurnType.REMOVED) {
            if (channelEvent.value.getId() === this.streamService.getChannelId()) {
              // If our current channel goes dark, reset the stream service
              this.streamService.update(null, null);
            }
          }
        }
      );
    this.streamService
      .observe()
      .subscribe(
        (stream: MediaStream) => {
          if (!stream) {
            // If the stream service got reset, automatically switch the channel
            const nextChannel = this.mitosis
              .getStreamManager()
              .getChannelTable()
              .find((channel: Channel) => channel.isActive());
            if (nextChannel) {
              this.streamService.update(nextChannel, nextChannel.getMediaStream());
            }
          }
        }
      );
  }

  public setTitle() {
    const titleEl = document.querySelector('title');
    titleEl.innerText = `${titleEl.innerText}—${this.mitosis.getMyAddress().getId()}`;
  }

  public toggleInfo() {
    this.infoVisible = !this.infoVisible;
  }

  public showFullScreenButton() {
    return this.fullscreenService.canEnterFullScreen();
  }

  public isInFullScreen() {
    return this.fullscreenService.isInFullScreen();
  }

  public toggleFullscreen() {
    if (this.isInFullScreen()) {
      this.fullscreenService.leave();
    } else {
      this.fullscreenService.enter();
    }
  }

  ngOnInit(): void {
    this.setTitle();
    this.subscribeStreamService();
    setInterval(() => {
      this.inactiveTimer++;
      this.isInactive = this.inactiveTimer > 3;
    }, 1000);

    window.addEventListener('mousemove', this.setActive.bind(this));
    window.addEventListener('keypress', this.setActive.bind(this));
    window.addEventListener('touchstart', this.setActive.bind(this));
  }
}
