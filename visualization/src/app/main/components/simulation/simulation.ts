import {Component, OnInit, ViewChild} from '@angular/core';
import {Edge, MockConnection, Simulation} from 'mitosis-simulation';
import {D3Model} from '../d3-directed-graph/models/d3';
import {D3DirectedGraphComponent} from '../d3-directed-graph/d3-directed-graph';
import {ConnectionState, Protocol} from 'mitosis';

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

  @ViewChild('graph')
  public graph: D3DirectedGraphComponent;

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
      this.simulation.getNodeMap().forEach((node) => {
        model.addNode(node);
        node.getMitosis().getRoutingTable()
          .getPeers()
          .forEach((p) => {
            p.getConnectionTable()
              .asArray()
              .forEach((c) => {
                if (c.getAddress().getProtocol() !== Protocol.VIA && c.getState() === ConnectionState.OPEN) {
                  model.addEdge(new Edge(node.getId(), c as MockConnection));
                }
              });
          });
      });
      this.model = model;
    });
  }
}
