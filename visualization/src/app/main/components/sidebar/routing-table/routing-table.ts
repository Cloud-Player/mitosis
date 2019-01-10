import {Component, Input, OnInit} from '@angular/core';
import {IConnection, Protocol, RemotePeer} from 'mitosis';
import {Node, Simulation} from 'mitosis-simulation';

@Component({
  selector: 'app-routing-table',
  templateUrl: './routing-table.html',
  styleUrls: ['./routing-table.scss'],
})
export class RoutingTableComponent implements OnInit {
  @Input()
  public selectedNode: Node;

  @Input()
  public simulation: Simulation;

  constructor() {
  }

  public getConnectionText(peer: RemotePeer) {
    let directConnections = 0;
    let viaConnections = 0;
    peer.getConnectionTable()
      .asArray()
      .forEach((connection: IConnection) => {
        if (connection.getAddress().getProtocol() === Protocol.VIA) {
          viaConnections++;
        } else {
          directConnections++;
        }
      });
    return `Dir ${directConnections} / Via ${viaConnections}`;
  }

  ngOnInit(): void {
  }
}
