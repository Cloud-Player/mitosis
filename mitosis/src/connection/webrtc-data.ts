import * as SimplePeer from 'simple-peer';
import {Message} from '../message/message';
import {ConnectionMeter} from '../metering/connection-meter';
import {IConnection, IConnectionOptions} from './interface';
import {WebRTCConnection} from './webrtc';
import {Address} from '../message/address';

export class WebRTCDataConnection extends WebRTCConnection implements IConnection {
  private static _statsDataChannelLabel = 'stats';
  private _unreliableChannel: RTCDataChannel;
  private _connectionMeter: ConnectionMeter;

  constructor(address: Address, options: IConnectionOptions) {
    super(address, options);
    this._connectionMeter = new ConnectionMeter(this.getMyAddress(), this.getAddress());
    this._connectionMeter
      .observeMessages()
      .subscribe(
        this.sendMessageOverUnreliableChannel.bind(this)
      );
    (window as any).meter = this._connectionMeter;
  }

  private sendMessageOverUnreliableChannel(message: Message) {
    if (this._unreliableChannel && this._unreliableChannel.readyState === 'open') {
      this._unreliableChannel.send(message.toString());
    }
  }

  private listenOnUnreliableChannel() {
    this._unreliableChannel.onopen = () => {
      this._connectionMeter.startMetering();
    };

    this._unreliableChannel.onmessage = (event: MessageEvent) => {
      const message = Message.fromString(event.data);
      this._connectionMeter.onMessage(message);
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

  public onClose() {
    super.onClose();
    this._connectionMeter.stopMetering();
  }

  public onOpen() {
    super.onOpen(this);
  }

  public establish(answer: SimplePeer.SignalData) {
    super.establish(answer);
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
