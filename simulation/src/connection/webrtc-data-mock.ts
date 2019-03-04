import {Address, IClock, IWebRTCConnectionOptions, Message, MessageSubject, TransmissionConnectionMeter} from 'mitosis';
import {WebRTCMockConnection} from './webrtc-mock';

export class WebRTCDataMockConnection extends WebRTCMockConnection {

  protected _meter: TransmissionConnectionMeter;

  public constructor(address: Address, clock: IClock, options: IWebRTCConnectionOptions) {
    super(address, clock, options);
    this._meter = new TransmissionConnectionMeter(
      this,
      this.getMyAddress(),
      address,
      this._clock);
    this._meter.observeMessages()
      .subscribe(this.send.bind(this));
  }

  public onMessage(message: Message) {
    if (
      message.getSubject() === MessageSubject.PING ||
      message.getSubject() === MessageSubject.PONG
    ) {
      this._meter.onMessage(message);
    } else {
      super.onMessage(message);
    }
  }
}
