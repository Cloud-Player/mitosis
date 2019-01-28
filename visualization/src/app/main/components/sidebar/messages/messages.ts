import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {MockConnection, Node} from 'mitosis-simulation';
import {ILogEvent, Logger, Message, Protocol} from 'mitosis';
import {Subscription} from 'rxjs';
import {MessageEventLogger} from '../../../services/message-event-logger';
import {LogEvent} from '../../../src/event-logger';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
})
export class MessagesComponent implements OnInit, OnChanges {
  @Input()
  public selectedNode: Node;

  constructor(private messageEventLogger: MessageEventLogger) {
  }

  public getMessageLog(): Array<LogEvent<Message>> {
    return this.messageEventLogger
      .getLogger()
      .getEventsForNodeId(this.selectedNode.getId());
  }

  public purgeMessages() {
    this.messageEventLogger
      .getLogger()
      .purgeEventsForNodeId(this.selectedNode.getId());
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
