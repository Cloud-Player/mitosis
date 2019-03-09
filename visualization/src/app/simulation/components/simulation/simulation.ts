import {Component, OnInit, ViewChild} from '@angular/core';
import {Logger} from 'mitosis';
import {Node, Simulation} from 'mitosis-simulation';
import {Subscription} from 'rxjs';
import {D3DirectedGraphComponent} from '../../../shared/components/d3-directed-graph/d3-directed-graph';
import {LogEventLogger} from '../../services/log-event-logger';
import {SimulationDirectedGraphModel} from '../../src/simulation-directed-graph-model';
import {SimulationEdgeModel} from '../../src/simulation-edge-model';
import {SimulationNodeModel} from '../../src/simulation-node-model';
import {SidebarComponent} from '../sidebar/sidebar';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrls: ['./simulation.scss'],
})
export class SimulationComponent implements OnInit {
  private scenario: any;
  private loggerSubscriptions: Subscription;
  public simulation: Simulation;
  public model: SimulationDirectedGraphModel;
  public selectedNode: Node;
  @ViewChild('graph')
  public graph: D3DirectedGraphComponent;
  @ViewChild('sidebar')
  public sidebar: SidebarComponent;

  constructor(private logEventLogger: LogEventLogger) {
    this.model = new SimulationDirectedGraphModel();
    this.simulation = Simulation.getInstance();
    this.loggerSubscriptions = new Subscription();
    this.simulation.setLoggerMaxSize(100);
    this.logEventLogger.getLogger().setLogSize(100);
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
      for (let i = 0; i < this.simulation.getSubTicks(); i++) {
        this.simulation.getClock().tick();
      }
    }
  }

  public selectNode(node: Node) {
    this.selectedNode = node;
  }

  public updateScenario(scenario: any) {
    this.scenario = scenario;
    this.model.reset();
    this.simulation.reset();
    this.simulation.start(scenario);
    this.loggerSubscriptions.unsubscribe();
    this.loggerSubscriptions = new Subscription();
    this.logEventLogger.getLogger().setClock(this.simulation.getClock());
    this.simulation.onUpdate(() => {
      const model = new SimulationDirectedGraphModel();
      this.loggerSubscriptions.unsubscribe();
      this.loggerSubscriptions = new Subscription();
      this.simulation.getNodeMap().forEach((node) => {
        let existingNode;
        if (this.model && this.model.getNodes().length > 0) {
          existingNode = this.model.getNodes().find((oldNode) => {
            return oldNode.getId() === node.getId();
          });
        }
        if (!existingNode) {
          existingNode = new SimulationNodeModel(
            node.getMitosis(),
            {
              networkInLogger: node.getNetworkInLogger(),
              networkOutLogger: node.getNetworkOutLogger(),
              messagesInLogger: node.getMessagesInLogger(),
              messagesOutLogger: node.getMessagesOutLogger()
            },
            node
          );
        }
        model.addNode(existingNode);

        this.loggerSubscriptions.add(
          Logger.getLogger(node.getId())
            .observeLogEvents()
            .subscribe(
              log => {
                this.logEventLogger
                  .getLogger()
                  .addEventForNodeId(node.getId(), log);
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
                (connection, index) => {
                  model.addEdge(new SimulationEdgeModel(node.getId(), connection, index));
                }
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

  public updateLogSize(size: number) {
    this.simulation.setLoggerMaxSize(size);
    this.logEventLogger.getLogger().setLogSize(size);
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
