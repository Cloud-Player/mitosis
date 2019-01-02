import {Mitosis} from '../mitosis';
import {RemotePeer} from '../mesh/remote-peer';
import {Address} from '../message/address';
import {PeerUpdate} from '../message/peer-update';
import {IRole} from './interface';

export class Newbie implements IRole {

  static readonly signalAddress = Address.fromString('mitosis/v1/p007/ws/localhost:8040/websocket');

  private _signal: RemotePeer;

  public onTick(mitosis: Mitosis): void {
    if (!this._signal) {
      mitosis.getRoutingTable().connectTo(Newbie.signalAddress).then(
        remotePeer => {
          this._signal = remotePeer;
          this.sendTableUpdate(mitosis);
        }
      );
    } else {
      this.sendTableUpdate(mitosis);
    }
  }

  private sendTableUpdate(mitosis: Mitosis): void {
    const tableUpdate = new PeerUpdate(
      mitosis.getMyAddress(),
      Newbie.signalAddress,
      mitosis.getRoutingTable().getPeers()
    );
    console.table('sending update', tableUpdate.getBody());
    this._signal.send(tableUpdate);
  }
}
