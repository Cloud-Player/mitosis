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
    const simulation = Simulation.getInstance();
    simulation.start(scenario);
    simulation.onUpdate(() => {
      const model = new D3Model();
      simulation.getNodes().forEach((node) => {
        model.addNode(node.getMyAddress().getId());
      });
      simulation.getEdges().forEach((edge) => {
        model.addEdge(edge.getSourceId(), edge.getAddress().getId());
      });
      this.model = model;
    });
    // setTimeout(() => {
    //   // this.model.addNode('p1');
    //   // this.model.addNode('p2');
    //   // this.model.addEdge('p1', 'p2');
    //   const n = 10;
    //   for (let i = 0; i < Math.pow(n,2); i++) {
    //     this.model.addNode(`p${i}`);
    //   }
    //
    //   for (let y = 0; y < n; ++y) {
    //     for (let x = 0; x < n; ++x) {
    //       if (y > 0) {
    //         this.model.addEdge(`p${(y - 1) * n + x}`, `p${y * n + x}`);
    //       }
    //
    //       if (x > 0) {
    //         this.model.addEdge(`p${(y * n + (x - 1))}`, `p${y * n + x}`);
    //       }
    //     }
    //   }
    //
    //   (window as any).model = this.model;
    // });
  }
}
