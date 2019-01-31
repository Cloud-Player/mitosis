import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Message} from 'mitosis';
import {Node} from 'mitosis-simulation';
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

  public getTitle(message: Message, selectedNode: Node): string {
    const receiver = message.getReceiver().getId();
    const sender = message.getSender().getId();
    const subject = message.getSubject();

    if (receiver === selectedNode.getId()) {
      return `receive ${subject} from ${sender}`;
    } else if (sender === selectedNode.getId()) {
      return `send ${subject} to ${receiver}`;
    } else {
      return `forward ${subject} from ${sender} to ${receiver}`;
    }
  }

  public getDirection(message: Message, selectedNode: Node): string {
    if (message.getReceiver().getId() === selectedNode.getId()) {
      return 'receive';
    } else if (message.getSender().getId() === selectedNode.getId()) {
      return 'send';
    } else {
      return 'forward';
    }
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
