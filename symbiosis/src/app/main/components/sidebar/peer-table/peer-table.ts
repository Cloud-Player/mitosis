import {Component, Input, OnInit} from '@angular/core';
import {ConnectionState, IConnection, IConnectionMeter, Mitosis, Protocol, RemotePeer, RoleType, WebRTCConnection} from 'mitosis';

@Component({
  selector: 'app-peer-table',
  templateUrl: './peer-table.html',
  styleUrls: ['./peer-table.scss'],
})
export class PeerTableComponent implements OnInit {
  @Input()
  public mitosis: Mitosis;

  constructor() {
  }

  public isDisabled(connection: IConnection) {
    return connection.getAddress().isProtocol(Protocol.VIA, Protocol.VIA_MULTI);
  }

  public getConnectionDirection(connection: IConnection): string {
    if (connection.getAddress().isProtocol(Protocol.WEBRTC_STREAM)) {
      if ((connection as WebRTCConnection).isInitiator()) {
        return '↗️';
      } else {
        return '↙️';
      }
    } else if (connection.getAddress().isProtocol(Protocol.WEBRTC_DATA, Protocol.WEBSOCKET)) {
      return '↔️';
    }
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
