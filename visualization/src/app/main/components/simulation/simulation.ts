import {Component, OnInit, ViewChild} from '@angular/core';
import {Logger} from 'mitosis';
import {Edge, MockConnection, Simulation} from 'mitosis-simulation';
import {Subscription} from 'rxjs';
import {LogEventLogger} from '../../services/log-event-logger';
import {MessageEventLogger} from '../../services/message-event-logger';
import {D3DirectedGraphComponent} from '../d3-directed-graph/d3-directed-graph';
import {D3Model} from '../d3-directed-graph/models/d3';
import {SidebarComponent} from '../sidebar/sidebar';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrls: ['./simulation.scss'],
})
export class SimulationComponent implements OnInit {
  public model: D3Model;
  public selectedNode: Node;
  @ViewChild('graph')
  public graph: D3DirectedGraphComponent;
  @ViewChild('sidebar')
  public sidebar: SidebarComponent;
  private scenario: any;
  private simulation: Simulation;

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
    this.scenario = scenario;
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
          .forEach(remotePeer => {
            remotePeer
              .getConnectionTable()
              .filterDirect()
              .forEach(
                connection =>
                  model.addEdge(new Edge(node.getId(), connection as MockConnection))
              );
          });
      });
      this.model = model;
    });
    this.sidebar.updateSimulation(this.simulation);
  }

  public getClockEmoji() {
    const clock = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
    if (this.getClock()) {
      if (this.getClock().isRunning()) {
        const tick = this.getClock().getTick() % clock.length;
        return clock[tick];
      } else {
        return '⏸';
      }
    }
  }

  public getClock() {
    if (this.simulation) {
      return this.simulation.getClock();
    }
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
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            this.toggleClock();
          }
          break;
        case 'ArrowRight':
          this.nextTick();
      }
    });

    let metaPressed = false;
    let shiftPressed = false;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
      }
      if (e.key === 'Meta') {
        metaPressed = true;
      }
      if (e.key === 'Shift') {
        shiftPressed = true;
      }
      if (e.key === 'r' && metaPressed && !shiftPressed) {
        if (this.scenario) {
          e.preventDefault();
          this.updateScenario(this.scenario);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Meta') {
        metaPressed = false;
      }
      if (e.key === 'Shift') {
        shiftPressed = false;
      }
    });
  }
}
