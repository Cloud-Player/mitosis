import {Component, Input, OnInit} from '@angular/core';
import {ConnectionState, RemotePeer, RoleType} from 'mitosis';
import {Node, Simulation} from 'mitosis-simulation';

@Component({
  selector: 'app-peer-table',
  templateUrl: './peer-table.html',
  styleUrls: ['./peer-table.scss'],
})
export class PeerTableComponent implements OnInit {
  @Input()
  public selectedNode: Node;

  @Input()
  public simulation: Simulation;

  constructor() {
  }

  public getPeerAnnotation(peer: RemotePeer) {
    let text = '';

    const roles = peer.getRoles().filter(role => role !== RoleType.PEER);
    if (roles.length) {
      text = `[${roles.join(', ')}]`;
    }

    const directConnections = peer.getConnectionTable().filterDirect();
    if (directConnections.length > 0) {
      let directText = `${directConnections.length}`;
      const nonOpenConnections = directConnections
        .exclude(
          table => table.filterByStates(ConnectionState.OPEN)
        ).length;
      if (nonOpenConnections > 0) {
        directText = `${nonOpenConnections}/${directText}`;
      }
      text = `${text} direct ${directText}`;
    }

    const viaConnections = peer.getConnectionTable().filterVia();
    if (viaConnections.length > 0) {
      text = `${text} via ${viaConnections.length}`;
    }

    return text;
  }

  ngOnInit(): void {
  }
}
