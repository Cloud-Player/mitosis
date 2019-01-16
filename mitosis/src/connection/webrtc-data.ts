import * as SimplePeer from 'simple-peer';
import {MasterClock} from '../clock/master';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {ConnectionMeter} from '../metering/connection-meter';
import {IConnection, IConnectionOptions} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCDataConnection extends WebRTCConnection implements IConnection {

  private static _statsDataChannelLabel = 'stats';
  private _unreliableChannel: RTCDataChannel;
  private _connectionMeter: ConnectionMeter;

  constructor(address: Address, options: IConnectionOptions) {
    super(address, options);
    if (!options.clock) {
      options.clock = new MasterClock();
      options.clock.start();
    }
    this._connectionMeter = new ConnectionMeter(
      this.getMyAddress(),
      this.getAddress(),
      options.clock
    );
    this._connectionMeter
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
    this._unreliableChannel.onopen = () => {
      this._connectionMeter.start();
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

  public onClose(): void {
    super.onClose();
    this._connectionMeter.stop();
  }

  public onOpen(): void {
    super.onOpen(this);
  }

  public getQuality(): number {
    return this._connectionMeter.getTq();
  }

  public establish(answer: SimplePeer.SignalData): void {
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
