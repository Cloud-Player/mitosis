import {Component, OnInit, ViewChild} from '@angular/core';
import {Logger, Protocol} from 'mitosis';
import {Edge, MockConnection, Simulation} from 'mitosis-simulation';
import {Subscription} from 'rxjs';
import {LogEventLogger} from '../../services/log-event-logger';
import {MessageEventLogger} from '../../services/message-event-logger';
import {D3DirectedGraphComponent} from '../d3-directed-graph/d3-directed-graph';
import {D3Model} from '../d3-directed-graph/models/d3';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrls: ['./simulation.scss'],
})
export class SimulationComponent implements OnInit {
  public model: D3Model;
  public selectedNode: Node;
  public simulation: Simulation;

  @ViewChild('graph')
  public graph: D3DirectedGraphComponent;

  constructor(private logEventLogger: LogEventLogger,
              private messageEventLogger: MessageEventLogger) {
    this.model = new D3Model();
    this.simulation = Simulation.getInstance();
  }

  private toggleClock() {
    if (this.simulation) {
      const clock = this.simulation.getClock();
      if (clock.isRunning()) {
        clock.pause();
      } else {
        clock.start();
      }
    }
  }

  private nextTick() {
    if (this.simulation) {
      this.simulation.getClock().tick();
    }
  }

  public selectNode(node: Node) {
    this.selectedNode = node;
  }

  public updateScenario(scenario: any) {
    this.simulation.reset();
    this.simulation.start(scenario);
    let subscriptions: Subscription = new Subscription();
    this.logEventLogger.getLogger().setClock(this.simulation.getClock());
    this.messageEventLogger.getLogger().setClock(this.simulation.getClock());
    this.simulation.onUpdate(() => {
      const model = new D3Model();
      subscriptions.unsubscribe();
      subscriptions = new Subscription();
      this.simulation.getNodeMap().forEach((node) => {
        model.addNode(node);

        subscriptions.add(
          Logger.getLogger(node.getId())
            .observeLogEvents()
            .subscribe(
              log => {
                this.logEventLogger
                  .getLogger()
                  .addEventForNodeId(node.getId(), log);
              })
        );

        subscriptions.add(
          node.getMitosis()
            .observeInternalMessages()
            .subscribe((message) => {
              this.messageEventLogger
                .getLogger()
                .addEventForNodeId(node.getId(), message);
            })
        );

        node.getMitosis()
          .getPeerManager()
          .getPeerTable()
          .asArray()
          .forEach((p) => {
            p.getConnectionTable()
              .asArray()
              .forEach((c) => {
                if (c.getAddress().getProtocol() !== Protocol.VIA) {
                  model.addEdge(new Edge(node.getId(), c as MockConnection));
                }
              });
          });
      });
      this.model = model;
    });
  }

  ngOnInit(): void {
    window.addEventListener('keyup', (ev: KeyboardEvent) => {
      const key = ev.code;
      switch (key) {
        case 'Space':
          const activeEl = document.activeElement;
          const inputs = ['input', 'select', 'button', 'textarea'];
          if (activeEl && inputs.indexOf(activeEl.tagName.toLowerCase()) !== -1) {
            return false;
          } else {
            this.toggleClock();
          }
          break;
        case 'ArrowRight':
          this.nextTick();
      }
    });
  }
}
