import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
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

  public getLogs(): Array<D3Model> {
    const outgoingTrafficModel = new D3Model('network-output', 'red', 'outgoing traffic');
    this.selectedNode
      .getNetworkOutLogger()
      .getLogs()
      .reverse()
      .map(
        val => {
          return {
            x: val.getTick(),
            y: val.getEvent().getStat().count
          };
        }
      )
      .forEach((val) => {
        outgoingTrafficModel.add(val.x, val.y);
      });
    const incomingTrafficModel = new D3Model('network-input', 'pink', 'incoming traffic');
    this.selectedNode
      .getNetworkInLogger()
      .getLogs()
      .reverse()
      .map(
        val => {
          return {
            x: val.getTick(),
            y: val.getEvent().getStat().count
          };
        }
      )
      .forEach((val) => {
        incomingTrafficModel.add(val.x, val.y);
      });
    return [outgoingTrafficModel, incomingTrafficModel];
  }

  public purgeLog() {
    this.selectedNode.getNetworkOutLogger().flush();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
