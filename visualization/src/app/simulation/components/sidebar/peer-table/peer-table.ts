import {Component, Input, OnInit} from '@angular/core';
import {
  ConnectionState,
  IConnection,
  NegotiationState,
  Protocol,
  RemotePeer,
  RoleType,
  TransmissionConnectionMeter,
  WebRTCConnection
} from 'mitosis';
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

  public getPeerAnnotation(peer: RemotePeer): string {
    const roles = peer.getRoles()
      .filter(roleType => roleType !== RoleType.PEER)
      .map(roleType => roleType.toString()[0].toUpperCase());
    const roleTag = roles.length ? `[${roles.join(', ')}]` : '';
    const peerTable = this.selectedNode.getMitosis().getPeerManager().getPeerTable();

    const quality = peer.getMeter().getQuality(peerTable)
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

  public getPeerStatsAnnotation(remotePeer: RemotePeer) {
    const peerTable = this.selectedNode.getMitosis().getPeerTable();
    const avgConnectionQuality = remotePeer.getMeter().getAverageConnectionQuality(peerTable);
    const avgPunishment = remotePeer.getMeter().getAverageConnectionPunishment();
    const isProtected = remotePeer.getMeter().getConnectionProtection();
    const lastseen = remotePeer.getMeter().getLastSeen();
    const expired = remotePeer.getMeter().lastSeenIsExpired();
    const routerRank = remotePeer.getMeter().getAverageRouterLinkQuality(peerTable);
    const acquisitionQuality = remotePeer.getMeter().getAcquisitionQuality(peerTable);
    return `
      ⌀ConQ:${avgConnectionQuality.toFixed(2)}
      ⌀PunQ:${avgPunishment.toFixed(2)}
      Prot:${isProtected === 1 ? 'y' : 'n'}
      LSeen:${lastseen}
      Exp:${expired ? 'y' : 'n'}
      ⌀RLQ:${routerRank.toFixed(2)}
      AcQ:${acquisitionQuality.toFixed(2)}
    `;
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

  public getConnectionAnnotation(connection: IConnection): string {
    const remotePeerTable = this.selectedNode.getMitosis().getPeerManager().getPeerTable();
    let annotation = '';
    if (connection.getState() !== ConnectionState.OPEN) {
      annotation += `${connection.getState()}`;
    }
    if (connection.getNegotiationState() !== NegotiationState.ESTABLISHED) {
      annotation += `${connection.getNegotiationState()}`;
    }
    if (connection.getAddress().isProtocol(Protocol.VIA_MULTI)) {
      annotation += `
        LSeen:${connection.getMeter().getLastSeen()}
      `;
    } else {
      annotation += `
        ConQ:${connection.getMeter().getQuality(remotePeerTable).toFixed(2)}
      `;
    }
    if (connection.getAddress().isProtocol(Protocol.WEBRTC_DATA)) {
      const meter = connection.getMeter() as TransmissionConnectionMeter;
      annotation += `
        Lat:${meter.getAverageLatency().toFixed(2)}
        LatQ:${meter.getLatencyQuality(remotePeerTable).toFixed(2)}
      `;
    }
    return annotation;
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
