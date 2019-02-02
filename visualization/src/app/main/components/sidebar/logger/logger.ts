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

  public filterQuery: string;

  constructor(private eventLogger: LogEventLogger) {
  }

  public getLogs(): Array<LogEvent<ILogEvent>> {
    const logs = this.eventLogger
      .getLogger()
      .getEventsForNodeId(this.selectedNode.getId());
    if (this.filterQuery) {
      return logs
        .filter(log => {
          return log.getEvent().data[0].match(this.filterQuery);
        });
    } else {
      return logs;
    }
  }

  public purgeLog() {
    this.eventLogger
      .getLogger()
      .purgeEventsForNodeId(this.selectedNode.getId());
  }

  public filterLog(searchQuery: string) {
    this.filterQuery = searchQuery;
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
