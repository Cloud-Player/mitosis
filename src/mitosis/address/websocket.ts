import {Address} from './address';
import {Protocol} from './interface';

export class WebSocketAddress extends Address {
  public constructor(peerId: number, payload: string) {
    super(peerId, Protocol.WEBSOCKET, payload);
  }
}
