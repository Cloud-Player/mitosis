import {Component, Input, OnInit} from '@angular/core';
import {ConnectionState, IConnection, Protocol, RemotePeer, RoleType, WebRTCConnection} from 'mitosis';
import {SimulationNodeModel} from '../../../src/simulation-node-model';

@Component({
  selector: 'app-peer-table',
  templateUrl: './peer-table.html',
  styleUrls: ['./peer-table.scss'],
})
export class PeerTableComponent implements OnInit {
  @Input()
  public selectedNode: SimulationNodeModel;

  constructor() {
  }

  public isDisabled(connection: IConnection): boolean {
    return connection.getAddress().isProtocol(Protocol.VIA, Protocol.VIA_MULTI);
  }

  public getPeerAnnotation(peer: RemotePeer): string {
    const roles = peer.getRoles()
      .filter(roleType => roleType !== RoleType.PEER)
      .map(roleType => roleType.toString()[0].toUpperCase());
    const roleTag = roles.length ? `[${roles.join(', ')}]` : '';

    const quality = peer.getMeter().getQuality()
      .toFixed(2)
      .toString();

    const directConnections = peer.getConnectionTable()
      .filterDirect().filterByStates(ConnectionState.OPENING, ConnectionState.OPEN);
    const nonOpenConnections = directConnections
      .exclude(table => table.filterByStates(ConnectionState.OPEN));
    const directText = `${directConnections.length - nonOpenConnections.length}/${directConnections.length}`;

    const viaText = peer.getConnectionTable()
      .filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI)
      .length
      .toString();

    return `${roleTag} ${quality}✫ ${directText}← ${viaText}⤺`;
  }

  public getConnectionDirection(connection: IConnection): string {
    switch (connection.getAddress().getProtocol()) {
      case Protocol.WEBSOCKET:
      case Protocol.WEBSOCKET_UNSECURE:
        return '↔️';
      case Protocol.WEBRTC_DATA:
        if ((connection as WebRTCConnection).isInitiator()) {
          return '↔️👤';
        } else {
          return '↔️';
        }
      case Protocol.WEBRTC_STREAM:
        if ((connection as WebRTCConnection).isInitiator()) {
          return '↗️';
        } else {
          return '↙️';
        }
    }
  }

  public getAllConnectionsAnnotation(): string {
    if (this.selectedNode) {
      const peerTable = this.selectedNode
        .getMitosis()
        .getPeerManager()
        .getPeerTable();

      const directConnections = peerTable
        .aggregateConnections(
          cTable => cTable
            .filterDirect()
            .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
        );
      const nonOpenConnections = directConnections
        .exclude(
          excludeCTable => excludeCTable.filterByStates(ConnectionState.OPEN)
        );
      const viaConnections = peerTable
        .aggregateConnections(cTable => cTable.filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI));

      const directText = `${directConnections.length - nonOpenConnections.length}/${directConnections.length}`;

      return `${directText}← ${viaConnections.length}⤺`;
    }
  }

  ngOnInit(): void {
  }
}
