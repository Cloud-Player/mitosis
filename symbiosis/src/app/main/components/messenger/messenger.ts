import {Component, OnInit, ViewChild} from '@angular/core';
import {Logger, LogLevel, Mitosis} from 'mitosis';
import {FullscreenService} from '../../../shared/services/fullscreen';
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

  constructor(private fullscreenService: FullscreenService) {
    Logger.setLevel(LogLevel.ERROR);
    this.mitosis = new Mitosis();
  }

  private setActive() {
    this.inactiveTimer = 0;
    this.isInactive = false;
  }

  public setTitle() {
    const titleEl = document.querySelector('title');
    const text = `${titleEl.innerText}—${this.mitosis.getMyAddress().getId()}`;
    titleEl.innerText = text;
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
    setInterval(() => {
      this.inactiveTimer++;
      this.isInactive = this.inactiveTimer > 3;
    }, 1000);

    window.addEventListener('mousemove', this.setActive.bind(this));
    window.addEventListener('keypress', this.setActive.bind(this));
    window.addEventListener('touchstart', this.setActive.bind(this));
  }
}
