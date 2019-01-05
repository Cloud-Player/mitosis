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
  constructor() {
  }

  ngOnInit(): void {
    const simulation = Simulation.getInstance();
    simulation.start(scenario);
    simulation.onUpdate(() => {
      this.model = new D3Model();
      simulation.getNodes().forEach((node) => {
        this.model.addNode(node.getMyAddress().getId());
      });
      simulation.getEdges().forEach((edge) => {
        this.model.addEdge(edge.getSourceId(), edge.getAddress().getId());
      });
    });
  }
}
