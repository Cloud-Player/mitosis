import {Component, Input, OnInit} from '@angular/core';
import {ConnectionState, IConnection, IConnectionMeter, Protocol, RemotePeer, RoleType} from 'mitosis';
import {Node, Simulation} from 'mitosis-simulation';
import {SimulationNodeModel} from '../../../src/simulation-node-model';

@Component({
  selector: 'app-peer-table',
  templateUrl: './peer-table.html',
  styleUrls: ['./peer-table.scss'],
})
export class PeerTableComponent implements OnInit {
  @Input()
  public selectedNode: SimulationNodeModel;

  @Input()
  public simulation: Simulation;

  constructor() {
  }

  public isDisabled(connection: IConnection) {
    return connection.getAddress().isProtocol(Protocol.VIA, Protocol.VIA_MULTI);
  }

  public getPeerAnnotation(peer: RemotePeer) {
    const roles = peer.getRoles()
      .filter(roleType => roleType !== RoleType.PEER)
      .map(roleType => roleType.toString()[0].toUpperCase());
    const roleTag = roles.length ? `[${roles.join(', ')}]` : '';

    const quality = peer.getMeter().getQuality()
      .toFixed(2)
      .toString();

    const directConnections = peer.getConnectionTable()
      .filterDirect();
    const nonOpenConnections = directConnections
      .exclude(table => table.filterByStates(ConnectionState.OPEN));
    const directText = `${directConnections.length - nonOpenConnections.length}/${directConnections.length}`;

    const viaText = peer.getConnectionTable()
      .filterByProtocol(Protocol.VIA, Protocol.VIA_MULTI)
      .length
      .toString();

    return `${roleTag} ${quality}✫ ${directText}← ${viaText}⤺`;
  }

  ngOnInit(): void {
  }
}
