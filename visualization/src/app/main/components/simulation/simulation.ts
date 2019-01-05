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
    this.model = new D3Model();
  }

  ngOnInit(): void {
    // const simulation = Simulation.getInstance();
    // simulation.start(scenario);
    // simulation.onUpdate(() => {
    //   this.model = new D3Model();
    //   simulation.getNodes().forEach((node) => {
    //     this.model.addNode(node.getMyAddress().getId());
    //   });
    //   simulation.getEdges().forEach((edge) => {
    //     this.model.addEdge(edge.getSourceId(), edge.getAddress().getId());
    //   });
    // });
    setTimeout(() => {
      this.model.addNode('p1');
      this.model.addNode('p2');
      this.model.addEdge('p1', 'p2');
    });

    (window as any).model = this.model;
  }
}
