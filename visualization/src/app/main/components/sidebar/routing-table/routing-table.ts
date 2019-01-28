import {Component, Input, OnInit} from '@angular/core';
import {ConnectionState, RemotePeer} from 'mitosis';
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
    const directConnections = peer.getConnectionTable().filterDirect();
    const allDirectConnections = directConnections.length;
    const openDirectConnections = directConnections.filterByStates(ConnectionState.OPEN).length;
    const directText = `direct ${openDirectConnections}/${allDirectConnections}`;

    const viaConnections = peer.getConnectionTable().filterVia().length;
    const viaText = `via ${viaConnections}`;

    return `${directText}, ${viaText}`;
  }

  ngOnInit(): void {
  }
}
