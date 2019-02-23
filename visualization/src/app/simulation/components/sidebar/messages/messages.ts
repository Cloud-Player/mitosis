import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {IMessage} from 'mitosis';
import {LogEvent, Node} from 'mitosis-simulation';
import {ISelectorOption} from '../../../../shared/components/ui/inputs/selector/selector';
import {SimulationNodeModel} from '../../../src/simulation-node-model';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss'],
})
export class MessagesComponent implements OnInit, OnChanges {
  private filterQuery: string;
  @Input()
  public selectedNode: SimulationNodeModel;

  public selectedOption = 'in';

  public options: Array<ISelectorOption> = [
    {label: 'Message Outbox', value: 'out'},
    {label: 'Message Inbox', value: 'in'}
  ];

  constructor() {
  }

  public getMessageLog(): LogEvent<IMessage>[] {
    let logs;
    if (this.selectedOption === 'in') {
      logs = this.selectedNode.getLoggers().messagesInLogger.getLogs();
    } else if (this.selectedOption === 'out') {
      logs = this.selectedNode.getLoggers().messagesOutLogger.getLogs();
    } else {
      console.error('Unsupported Selctor Option', this.selectedOption);
      return;
    }
    if (this.filterQuery) {
      logs = logs.filter((entry) => {
        return this.getTitle(entry.getEvent(), this.selectedNode).match(this.filterQuery);
      });
    }
    return logs;
  }

  public purgeMessages() {
    if (this.selectedOption === 'in') {
      this.selectedNode.getLoggers().messagesInLogger.flush();
    } else if (this.selectedOption === 'out') {
      this.selectedNode.getLoggers().messagesOutLogger.flush();
    }
  }

  public filterMessages(filterQuery: string) {
    this.filterQuery = filterQuery;
  }

  public getTitle(message: IMessage, selectedNode: SimulationNodeModel): string {
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
