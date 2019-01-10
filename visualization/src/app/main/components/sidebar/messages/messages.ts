import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {MockConnection, Node} from 'mitosis-simulation';
import {Logger, Message, Protocol} from 'mitosis';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
})
export class MessagesComponent implements OnInit, OnChanges {
  private maxLogs = 100;
  private _subscriptions: Subscription;
  @Input()
  public selectedNode: Node;

  public messages: Array<Message> = [];

  constructor() {
    this._subscriptions = new Subscription();
  }

  private initNode() {
    this.messages = [];
    this._subscriptions.unsubscribe();
    this._subscriptions = new Subscription();
    this._subscriptions.add(
      this.selectedNode.getMitosis()
        .observeInternalMessages()
        .subscribe((message) => {
          this.messages.unshift(message);
          this.messages.splice(this.maxLogs);
        })
    );
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
