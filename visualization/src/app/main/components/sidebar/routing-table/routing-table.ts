import {Component, Input, OnInit} from '@angular/core';
import {ConnectionState, IConnection, Protocol, RemotePeer} from 'mitosis';
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
    let openDirectConnections = 0;
    let openingDirectConnections = 0;
    let viaConnections = 0;
    peer.getConnectionTable()
      .asArray()
      .forEach((connection: IConnection) => {
        if (connection.getAddress().getProtocol() === Protocol.VIA) {
          viaConnections++;
        } else {
          if (connection.getState() === ConnectionState.OPEN) {
            openDirectConnections++;
          } else if (connection.getState() === ConnectionState.OPENING) {
            openingDirectConnections++;
          }
        }
      });
    const openDirText = `Dir ${openDirectConnections}`;
    const openeningText = openingDirectConnections > 0 ? `(${openingDirectConnections}?)` : '';
    const viaText = `Via ${viaConnections}`;
    return `${openDirText} ${openeningText}/ ${viaText}`;
  }

  ngOnInit(): void {
  }
}
