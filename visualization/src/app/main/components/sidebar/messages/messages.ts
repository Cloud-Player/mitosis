import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {IMessage} from 'mitosis';
import {Node, LogEvent} from 'mitosis-simulation';
import {MessageEventLogger} from '../../../services/message-event-logger';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
})
export class MessagesComponent implements OnInit, OnChanges {
  private filterQuery: string;
  @Input()
  public selectedNode: Node;

  constructor(private messageEventLogger: MessageEventLogger) {
  }

  public getMessageLog(): LogEvent<IMessage>[] {
    let logs = this.selectedNode.getOutbox().getLogs();
    if (this.filterQuery) {
      logs = logs.filter((entry) => {
        return this.getTitle(entry.getEvent(), this.selectedNode).match(this.filterQuery);
      });
    }
    return logs;
  }

  public purgeMessages() {
    this.selectedNode.getInbox().flush();
  }

  public filterMessages(filterQuery: string) {
    this.filterQuery = filterQuery;
  }

  public getTitle(message: IMessage, selectedNode: Node): string {
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

  public getDirection(message: IMessage, selectedNode: Node): string {
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
