import {Address} from './address';
import {Protocol} from './interface';

export class WebRTCAddress extends Address {
  public constructor(peerId: number, payload: string) {
    super(peerId, Protocol.WEBRTC, payload);
  }
}
