import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Node} from 'mitosis-simulation';
import {D3Model} from '../../../../shared/components/d3-line-chart/models/d3';
import {LogEventLogger} from '../../../services/log-event-logger';
import {SimulationNodeModel} from '../../../src/simulation-node-model';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.html',
  styleUrls: ['./stats.scss'],
})
export class StatsComponent implements OnInit, OnChanges {
  @Input()
  public selectedNode: SimulationNodeModel;

  constructor() {
  }

  public getLogs(): Array<D3Model> {
    const outgoingTrafficModel = new D3Model('network-output', 'red', 'outgoing traffic');
    this.selectedNode
      .getLoggers()
      .networkOutLogger
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
    const incomingTrafficModel = new D3Model('network-input', 'blue', 'incoming traffic');
    this.selectedNode
      .getLoggers()
      .networkInLogger
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
    this.selectedNode.getLoggers().networkInLogger.flush();
    this.selectedNode.getLoggers().networkOutLogger.flush();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
