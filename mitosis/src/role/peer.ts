import {ConnectionTable} from '../connection/connection-table';
import {ConnectionState, IConnection, Protocol} from '../connection/interface';
import {RemotePeer} from '../mesh/remote-peer';
import {RoutingTable} from '../mesh/routing-table';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {PeerUpdate} from '../message/peer-update';
import {Mitosis} from '../mitosis';
import {IRole} from './interface';

export class Peer implements IRole {

  private static readonly connectionGoal = 5;

  private satisfyConnectionGoal(routingTable: RoutingTable): void {
    const directConnections: Array<IConnection> = [];
    const indirectPeers: Array<RemotePeer> = [];
    routingTable.getPeers().map(
      peer => {
        const connectionTable = peer.getConnectionTable()
          .filterByStates(ConnectionState.OPEN, ConnectionState.OPENING)
          .filterDirect();
        if (connectionTable.length) {
          directConnections.push(...connectionTable.asArray());
        } else {
          indirectPeers.push(peer);
        }
      }
    );
    const insufficientConnections = directConnections.length < Peer.connectionGoal;
    if (insufficientConnections && indirectPeers.length) {
      const address = new Address(indirectPeers.shift().getId(), Protocol.WEBRTC);
      routingTable.connectTo(address);
    } else if (directConnections.length > Peer.connectionGoal) {
      const worstConnection = new ConnectionTable(directConnections)
        .sortByQuality()
        .pop();
      if (worstConnection.getState() !== ConnectionState.OPENING) {
        worstConnection.close();
      }
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
          directConnection.send(tableUpdate);
        }
      }
    );
  }

  public onTick(mitosis: Mitosis): void {
    this.satisfyConnectionGoal(mitosis.getRoutingTable());
    this.publishRoutingTable(mitosis.getMyAddress(), mitosis.getRoutingTable());
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }
}
