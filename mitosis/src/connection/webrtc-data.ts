import * as SimplePeer from 'simple-peer';
import {IClock} from '../clock/interface';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {TransmissionConnectionMeter} from '../metering/connection-meter/transmission-connection-meter';
import {IConnection, IConnectionOptions, IWebRTCConnectionOptions} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCDataConnection extends WebRTCConnection implements IConnection {

  private static _statsDataChannelLabel = 'stats';
  private _unreliableChannel: RTCDataChannel;
  protected _meter: TransmissionConnectionMeter;

  constructor(address: Address, clock: IClock, options: IConnectionOptions) {
    super(address, clock, options);

    this._meter = new TransmissionConnectionMeter(
      this,
      this.getMyAddress(),
      this.getAddress(),
      this._clock
    );
    this._meter
      .observeMessages()
      .subscribe(
        this.sendMessageOverUnreliableChannel.bind(this)
      );
  }

  private sendMessageOverUnreliableChannel(message: Message): void {
    if (this._unreliableChannel && this._unreliableChannel.readyState === 'open') {
      this._unreliableChannel.send(message.toString());
    }
  }

  private listenOnUnreliableChannel(): void {
    this._unreliableChannel.onmessage = (event: MessageEvent) => {
      const message = Message.fromString(event.data);
      this._meter.onMessage(message);
    };
  }

  protected bindClientListeners(): void {
    super.bindClientListeners();
    const superOnDataChannel = this.getRTCPeerConnection().ondatachannel;
    this.getRTCPeerConnection().ondatachannel = (event: RTCDataChannelEvent) => {
      if (event.channel.label === WebRTCDataConnection._statsDataChannelLabel) {
        this._unreliableChannel = event.channel;
        this.listenOnUnreliableChannel();
      } else if (typeof superOnDataChannel === 'function') {
        superOnDataChannel.call(this._client, event);
      }
    };
  }

  protected getAdditionalOfferPayload(): { [key: string]: any } {
    return {};
  }

  public establish(options: IWebRTCConnectionOptions): void {
    super.establish(options);
    this._unreliableChannel = super.getRTCPeerConnection()
      .createDataChannel(
        WebRTCDataConnection._statsDataChannelLabel,
        {
          ordered: false,
          maxRetransmits: 0
        }
      );
    this.listenOnUnreliableChannel();
  }
}
