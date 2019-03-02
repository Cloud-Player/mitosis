import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Protocol, RoleType} from 'mitosis';
import {MockConnection, Simulation} from 'mitosis-simulation';
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

  public wssDelay: number;
  public webRTCDelay: number;

  constructor() {
  }

  private updateDelayForProtocol(protocol: Protocol, delay: number) {
    this.selectedNode
      .getMitosis()
      .getPeerManager()
      .getPeerTable()
      .forEach((peer) => {
        peer.getConnectionTable()
          .forEach((c) => {
            if (c.getAddress().getProtocol() === protocol) {
              (c as MockConnection).setDelay(delay);
            }
          });
      });
  }

  private initNode() {
    this.selectedNode
      .getMitosis()
      .getPeerManager()
      .getPeerTable()
      .forEach((peer) => {
        peer.getConnectionTable()
          .forEach((c) => {
            if (c.getAddress().getProtocol() === Protocol.WEBRTC_DATA) {
              this.webRTCDelay = (c as MockConnection).getDelay();
            }
            if (c.getAddress().getProtocol() === Protocol.WEBSOCKET) {
              this.wssDelay = (c as MockConnection).getDelay();
            }
          });
      });
  }

  public updateWssDelay(delay: number) {
    this.updateDelayForProtocol(Protocol.WEBSOCKET, delay);
  }

  public updateWebRtcDelay(delay: number) {
    this.updateDelayForProtocol(Protocol.WEBRTC_STREAM, delay);
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

  public toggleNetwork() {
    const existingNode = this.simulation.getNodeMap().get(this.selectedNode.getMitosis().getMyAddress().getId());
    if (existingNode.hasNetwork()) {
      existingNode.setHasNetwork(false);
    } else {
      existingNode.setHasNetwork(true);
    }
  }

  public hasNetwork() {
    const existingNode = this.simulation.getNodeMap().get(this.selectedNode.getMitosis().getMyAddress().getId());
    if (existingNode) {
      return existingNode.hasNetwork();
    }
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
