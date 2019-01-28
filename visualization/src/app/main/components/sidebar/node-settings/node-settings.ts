import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Protocol} from 'mitosis';
import {MockConnection, Node} from 'mitosis-simulation';

@Component({
  selector: 'app-node-settings',
  templateUrl: './node-settings.html',
  styleUrls: ['./node-settings.scss'],
})
export class NodeSettingsComponent implements OnInit, OnChanges {
  @Input()
  public selectedNode: Node;

  public wssDelay: number;
  public webRTCDelay: number;

  constructor() {
  }

  private updateDelayForProtocol(protocol: Protocol, delay: number) {
    this.selectedNode
      .getMitosis()
      .getPeerManager()
      .getPeerTable()
      .asArray()
      .forEach((peer) => {
        peer.getConnectionTable()
          .asArray()
          .forEach((c) => {
            if (c.getAddress().getProtocol() === protocol) {
              (c as MockConnection).setDelay(delay);
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
      return Array.from(this.selectedNode.getMitosis().getRoles().keys());
    } else {
      return [];
    }
  }

  private initNode() {
    this.selectedNode
      .getMitosis()
      .getPeerManager()
      .getPeerTable()
      .asArray()
      .forEach((peer) => {
        peer.getConnectionTable()
          .asArray()
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

  ngOnInit(): void {
    this.initNode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedNode && changes.selectedNode.currentValue) {
      this.initNode();
    }
  }
}
