import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {RoleType} from 'mitosis';
import {Simulation} from 'mitosis-simulation';
import {SimulationNodeModel} from '../../../src/simulation-node-model';

@Component({
  selector: 'app-node-settings',
  templateUrl: './node-settings.html',
  styleUrls: ['./node-settings.scss'],
})
export class NodeSettingsComponent implements OnInit, OnChanges {
  @Input()
  public selectedNode: SimulationNodeModel;

  @Input()
  public simulation: Simulation;

  @Input()
  public availableNodeIds: Array<string>;

  public stability: number;
  public latency: number;
  public message = {
    receiver: null,
    body: null
  };

  constructor() {
  }

  private initNode() {
    this.latency = this.selectedNode.getSimulationNode().getNetworkLatency();
    this.stability = this.selectedNode.getSimulationNode().getNetworkStability();
  }

  public sliderTransformer(val: number) {
    return `${(val * 100).toFixed(0)}%`;
  }

  public getRoles() {
    if (this.selectedNode) {
      return this.selectedNode.getMitosis().getRoleManager().getRoles();
    } else {
      return [];
    }
  }

  public getRoleIcon(role) {
    switch (role) {
      case RoleType.ROUTER:
        return 'fa fa-map-signs';
      case RoleType.SIGNAL:
        return 'fa fa-podcast';
      case RoleType.NEWBIE:
        return 'fa fa-user-o';
      case RoleType.PEER:
        return 'fa fa-user';
    }
  }

  public deletePeer() {
    this.simulation.removeNode(this.selectedNode.getMitosis());
  }

  public updateNetwork() {
    this.selectedNode.getSimulationNode().setNetworkStability(this.stability);
    this.selectedNode.getSimulationNode().setNetworkLatency(this.latency);
  }

  public sendMessage() {
    this.selectedNode.getMitosis().sendMessageTo(this.message.receiver, this.message.body);
  }

  ngOnInit(): void {
    this.initNode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedNode && changes.selectedNode.currentValue) {
      this.initNode();
    }
  }
}
