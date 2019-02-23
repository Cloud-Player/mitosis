import {HttpClient} from '@angular/common/http';
import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Node, Simulation} from 'mitosis-simulation';
import {D3DirectedGraphComponent} from '../../../shared/components/d3-directed-graph/d3-directed-graph';
import {SearchInputComponent} from '../../../shared/components/ui/inputs/search/search';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent implements OnInit {
  private searchNode: string;
  private selectedScenario: any;
  public availableNodeIds: Array<string> = [];
  public simulation: Simulation;

  @Input()
  public selectedNode: Node;

  @Input()
  public graph: D3DirectedGraphComponent;

  @Output()
  public scenarioChange: EventEmitter<any>;

  @ViewChild('searchInput')
  public searchEl: SearchInputComponent;

  constructor(private _http: HttpClient) {
    this.scenarioChange = new EventEmitter();
    this.simulation = Simulation.getInstance();
  }

  public updateSimulation(simulation: Simulation) {
    this.simulation = simulation;
    this.selectedNode = null;
    this.simulation.onUpdate(() => {
      this.availableNodeIds = [];
      this.simulation.getNodeMap().forEach((node) => {
        this.availableNodeIds.push(node.getId());
      });
      if (this.searchNode && !this.selectedNode) {
        this.graph.selectNode(this.searchNode);
      }
    });
  }

  public search(nodeId: string) {
    this.searchNode = nodeId;
    this.graph.selectNode(nodeId);
  }

  public updateScenario(scenario) {
    this.scenarioChange.emit(scenario);
    this.selectedScenario = scenario;
  }

  public restart() {
    if (this.selectedScenario) {
      this.scenarioChange.emit(this.selectedScenario);
    }
  }

  public getClock() {
    return this.simulation.getClock();
  }

  ngOnInit(): void {
    this.graph.selectedNodeChange
      .subscribe((node: Node) => {
        if (!this.searchEl.isActive()) {
          if (node) {
            this.searchEl.searchOnInput(node.getId());
          } else {
            this.searchEl.searchOnInput(null);
          }
        }
      });
  }
}
