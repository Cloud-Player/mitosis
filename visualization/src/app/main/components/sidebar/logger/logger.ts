import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {ILogEvent, Logger} from 'mitosis';
import {Node} from 'mitosis-simulation';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.html',
  styleUrls: ['./logger.scss'],
})
export class LoggerComponent implements OnInit {

  @Input()
  public selectedNode: Node;

  private _messages: Array<ILogEvent>;

  constructor() {
  }

  public getMessageLog(): Array<ILogEvent> {
    return this._messages;
  }

  private initNode() {
    this._messages = [];
    Logger.getLogger(this.selectedNode.getId()).observeLogEvents().subscribe(
      ev => {
        this._messages.push(ev);
      });
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
