import {ConnectionState} from '../connection/interface';
import {Mitosis} from '../index';
import {RemotePeer} from '../mesh/remote-peer';
import {Address} from '../message/address';
import {Protocol} from '../message/interface';
import {IRole} from './interface';

export class Peer implements IRole {

  public onTick(mitosis: Mitosis): void {
    let directConnectionCount = 0;
    const indirectConnections: Array<RemotePeer> = [];
    mitosis.getRoutingTable().getPeers().map(
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
    if (directConnectionCount < 5 && indirectConnections.length) {
      console.log('acquiring new peers');
      const indirectPeer = indirectConnections.shift();
      const address = new Address(indirectPeer.getId(), Protocol.WEBRTC);
      mitosis.getRoutingTable().connectTo(address);
    } else if (directConnectionCount < 5 && !indirectConnections.length) {
      console.log('no new peers to add');
    } else {
      console.log('need to loose peers');
    }
  }
}
