import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {MockConnection, Node} from 'mitosis-simulation';
import {Message, Protocol} from 'mitosis';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
})
export class MessagesComponent implements OnInit, OnChanges {
  @Input()
  public selectedNode: Node;

  public messages: Array<Message> = [];

  constructor() {
  }

  private initNode() {
    this.messages = [];
    this.selectedNode.getMitosis()
      .observeInternalMessages()
      .subscribe((message) => {
        this.messages.push(message);
      });
  }

  public purgeMessages() {
    this.messages = [];
  }

  ngOnInit(): void {
    this.initNode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedNode && changes.selectedNode.currentValue) {
      this.initNode();
    }
  }
}
