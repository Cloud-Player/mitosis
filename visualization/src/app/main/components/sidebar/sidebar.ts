import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Node, Simulation} from 'mitosis-simulation';
import {SearchInputComponent} from '../../../shared/components/ui/inputs/search/search';
import {D3DirectedGraphComponent} from '../d3-directed-graph/d3-directed-graph';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent implements OnInit {
  private searchNode: string;
  public nodeQuery: string;
  public availableNodeIds: Array<string> = [];

  @Input()
  public selectedNode: Node;

  @Input()
  public simulation: Simulation;

  @Input()
  public graph: D3DirectedGraphComponent;

  @ViewChild('searchInput')
  public searchEl: SearchInputComponent;

  constructor() {
  }

  public search(nodeId: string) {
    this.searchNode = nodeId;
    this.graph.selectNode(nodeId);
  }

  public getClock() {
    return this.simulation.getClock();
  }

  ngOnInit(): void {
    this.simulation.onUpdate(() => {
      this.availableNodeIds = [];
      this.simulation.getNodes().forEach((node) => {
        this.availableNodeIds.push(node.getId());
      });
      if (this.searchNode && !this.selectedNode) {
        this.graph.selectNode(this.searchNode);
      }
    });

    this.graph.selectedNodeChange
      .subscribe((node: Node) => {
        if (node && !this.searchEl.isActive()) {
          this.searchEl.searchOnInput(node.getId());
        }
      });
  }
}
