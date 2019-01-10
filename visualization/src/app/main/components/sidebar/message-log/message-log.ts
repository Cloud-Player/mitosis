import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {Logger} from 'mitosis';
import {Node} from 'mitosis-simulation';

@Component({
  selector: 'app-message-log',
  templateUrl: './message-log.html',
  styleUrls: ['./message-log.scss'],
})
export class MessageLogComponent implements OnInit {

  @Input()
  public selectedNode: Node;

  private _messages: Array<any>;

  constructor() {
  }

  private initNode() {
    this._messages = [];
    Logger.getLogger(this.selectedNode.getId()).observeLogEvents().subscribe(
      ev => this._messages.push(ev));
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
