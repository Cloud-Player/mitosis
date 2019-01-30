import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ILogEvent} from 'mitosis';
import {Node} from 'mitosis-simulation';
import {LogEventLogger} from '../../../services/log-event-logger';
import {LogEvent} from '../../../src/event-logger';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.html',
  styleUrls: ['./logger.scss'],
})
export class LoggerComponent implements OnInit, OnChanges {
  @Input()
  public selectedNode: Node;

  constructor(private eventLogger: LogEventLogger) {
  }

  public getLogs(): Array<LogEvent<ILogEvent>> {
    return this.eventLogger
      .getLogger()
      .getEventsForNodeId(this.selectedNode.getId());
  }

  public purgeLog() {
    this.eventLogger
      .getLogger()
      .purgeEventsForNodeId(this.selectedNode.getId());
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
