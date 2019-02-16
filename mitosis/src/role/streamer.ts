import {IConnection, Protocol} from '../connection/interface';
import {IMessage} from '../message/interface';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole} from './interface';
import {broadcastStream} from './task/broadcast-stream';

export class Streamer implements IRole {

  public onConnectionOpen(mitosis: Mitosis, connection: IConnection): void {
    if (connection.getAddress().getProtocol() === Protocol.WEBRTC_STREAM) {
      broadcastStream(mitosis, connection);
    }
  }

  public onConnectionClose(mitosis: Mitosis, connection: IConnection): void {
  }

  public onMessage(mitosis: Mitosis, message: IMessage): void {
  }

  public onTick(mitosis: Mitosis): void {
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return false;
  }
}
