import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Simulation} from 'mitosis-simulation';
import {D3Model} from '../d3-directed-graph/models/d3';

const scenario = require('./scenario/hello-world.json');

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrls: ['./simulation.scss'],
})
export class SimulationComponent implements OnInit {
  public model: D3Model;
  public selectedNode: Node;
  public simulation: Simulation;

  constructor() {
    this.model = new D3Model();
    this.simulation = Simulation.getInstance();
  }

  public selectNode(node: Node) {
    this.selectedNode = node;
  }

  ngOnInit(): void {
    this.simulation.start(scenario);
    this.simulation.onUpdate(() => {
      const model = new D3Model();
      this.simulation.getNodes().forEach((node) => {
        model.addNode(node);
      });
      this.simulation.getEdges().forEach((edge) => {
        model.addEdge(edge);
      });
      this.model = model;
    });
  }
}
