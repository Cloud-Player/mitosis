import {Mitosis} from '../index';
import {RemotePeer} from '../mesh/remote-peer';
import {Address} from '../message/address';
import {PeerUpdate} from '../message/peer-update';
import {IRole} from './interface';

export class Newbie implements IRole {

  // static readonly signalAddress = Address.fromString('mitosis/v1/0/wss/signal.aux.app/websocket');
  static readonly signalAddress = Address.fromString('mitosis/v1/0/ws/localhost:8040/websocket');

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
    console.log('sending update', tableUpdate);
    this._signal.send(tableUpdate);
  }
}
