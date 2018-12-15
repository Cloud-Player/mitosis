import {ConnectionState} from '../connection/interface';
import {Mitosis} from '../index';
import {RemotePeer} from '../mesh/remote-peer';
import {RoutingTable} from '../mesh/routing-table';
import {Address} from '../message/address';
import {Protocol} from '../message/interface';
import {PeerUpdate} from '../message/peer-update';
import {IRole} from './interface';

export class Peer implements IRole {

  private static readonly connectionGoal = 5;

  private satisfyConnectionGoal(routingTable: RoutingTable): void {
    let directConnectionCount = 0;
    const indirectConnections: Array<RemotePeer> = [];
    routingTable.getPeers().map(
      peer => {
        const directConnectionsPerPeer = peer.getConnectionTable()
          .filterByStates(ConnectionState.OPEN, ConnectionState.CONNECTING)
          .filterDirect()
          .length;
        if (directConnectionsPerPeer) {
          directConnectionCount += directConnectionsPerPeer;
        } else {
          indirectConnections.push(peer);
        }
      }
    );
    const insufficientConnections = directConnectionCount < Peer.connectionGoal;
    if (insufficientConnections && indirectConnections.length) {
      console.log('acquiring new peers');
      const indirectPeer = indirectConnections.shift();
      const address = new Address(indirectPeer.getId(), Protocol.WEBRTC);
      routingTable.connectTo(address);
    } else if (insufficientConnections && !indirectConnections.length) {
      console.log('no new peers to add');
    } else {
      console.log('need to loose peers');
    }
  }

  private publishRoutingTable(myAddress: Address, routingTable: RoutingTable): void {
    routingTable.getPeers().forEach(remotePeer => {
        const directConnection = remotePeer.getConnectionTable()
          .filterByStates(ConnectionState.OPEN)
          .filterDirect()
          .shift();
        if (directConnection) {
          const tableUpdate = new PeerUpdate(
            myAddress,
            directConnection.getAddress(),
            routingTable.getPeers()
          );
          remotePeer.send(tableUpdate);
        }
      }
    );
  }

  public onTick(mitosis: Mitosis): void {
    this.satisfyConnectionGoal(mitosis.getRoutingTable());
    this.publishRoutingTable(mitosis.getMyAddress(), mitosis.getRoutingTable());
  }
}
