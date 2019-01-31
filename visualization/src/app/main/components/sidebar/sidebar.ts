import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Node, Simulation} from 'mitosis-simulation';
import {SearchInputComponent} from '../../../shared/components/ui/inputs/search/search';
import {D3DirectedGraphComponent} from '../d3-directed-graph/d3-directed-graph';
import {ISelectorOption} from '../../../shared/components/ui/inputs/selector/selector';
import {HttpClient} from '@angular/common/http';

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
        if (node && !this.searchEl.isActive()) {
          this.searchEl.searchOnInput(node.getId());
        }
      });
  }
}
