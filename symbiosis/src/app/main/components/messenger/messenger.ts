import {Component, OnInit, ViewChild} from '@angular/core';
import {Logger, LogLevel, Mitosis} from 'mitosis';
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

  public peersVisible = false;

  constructor() {
    this.mitosis = new Mitosis();
    Logger.setLevel(LogLevel.ERROR);
  }

  public setTitle() {
    const titleEl = document.querySelector('title');
    const text = `${titleEl.innerText}—${this.mitosis.getMyAddress().getId()}`;
    titleEl.innerText = text;
  }

  public togglePeerList() {
    this.peersVisible = !this.peersVisible;
  }

  ngOnInit(): void {
    this.setTitle();
  }
}
