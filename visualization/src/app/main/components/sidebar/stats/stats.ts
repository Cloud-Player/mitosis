import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ILogEvent} from 'mitosis';
import {Node} from 'mitosis-simulation';
import {LogEventLogger} from '../../../services/log-event-logger';
import {D3Model} from '../../d3-line-chart/models/d3';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.html',
  styleUrls: ['./stats.scss'],
})
export class StatsComponent implements OnInit, OnChanges {
  @Input()
  public selectedNode: Node;

  public filterQuery: string;

  constructor(private eventLogger: LogEventLogger) {
  }

  public getLogs(): D3Model {
    const model = new D3Model();
    this.selectedNode
      .getNetworkOutLogger()
      .getLogs()
      .reverse()
      .map(
        val => {
          return {
            x: val.getTick(),
            y: val.getEvent().getStat().amount
          };
        }
      )
      .forEach((val) => {
        model.add(val.x, val.y);
      });
    return model;
  }

  public purgeLog() {
    this.selectedNode.getNetworkOutLogger().flush();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
