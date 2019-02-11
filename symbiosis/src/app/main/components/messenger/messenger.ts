import {Component, OnInit, ViewChild} from '@angular/core';
import {Logger, Mitosis} from 'mitosis';
import {Subscription} from 'rxjs';
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

  constructor() {
    this.mitosis = new Mitosis();
  }


  public selectNode(node: Node) {
    this.selectedNode = node;
  }

  ngOnInit(): void {

  }
}
