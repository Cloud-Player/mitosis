import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ILogEvent, Logger} from 'mitosis';
import {Node} from 'mitosis-simulation';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.html',
  styleUrls: ['./logger.scss'],
})
export class LoggerComponent implements OnInit, OnChanges {
  private maxLogs = 100;

  @Input()
  public selectedNode: Node;

  private _messages: Array<ILogEvent> = [];
  private _subscriptions: Subscription;

  constructor() {
    this._subscriptions = new Subscription();
  }

  public getMessageLog(): Array<ILogEvent> {
    return this._messages;
  }

  private initNode() {
    this._messages = [];
    this._subscriptions.unsubscribe();
    this._subscriptions = new Subscription();
    this._subscriptions.add(
      Logger.getLogger(this.selectedNode.getId())
        .observeLogEvents()
        .subscribe(
          ev => {
            this._messages.unshift(ev);
            this._messages.splice(this.maxLogs);
          })
    );
  }

  public purgeMessages() {
    this._messages = [];
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
