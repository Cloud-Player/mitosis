import * as SimplePeer from 'simple-peer';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {Ping} from '../message/ping';
import {Pong} from '../message/pong';
import {IConnection} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCDataConnection extends WebRTCConnection implements IConnection {
  private static _statsDataChannelLabel = 'stats';

  private _statsDataChannel: RTCDataChannel;
  private _pingSequence = 0;

  private handlePing(message: Ping) {
    console.log(`Got ping from ${message.getSender().getId()} ${message.getBody()}`);
  }

  private handlePong(message: Pong) {

  }

  private listenOnStatsDataChannel() {
    this._statsDataChannel.onmessage = (event: MessageEvent) => {
      const msg = Message.fromString(event.data);
      if (msg.getSubject() === MessageSubject.PING) {
        this.handlePing(msg as Ping);
      } else if (msg.getSubject() === MessageSubject.PONG) {
        this.handlePong(msg as Pong);
      } else {
        throw new Error(`${msg.getSubject()} can not be processed! Data channel support only Ping/Pong messages`);
      }
    };
  }

  protected bindClientListeners(): void {
    super.bindClientListeners();
    console.log(this.getRTCPeerConnection().ondatachannel);
    const superOnDataChannel = this.getRTCPeerConnection().ondatachannel;
    this.getRTCPeerConnection().ondatachannel = (event: RTCDataChannelEvent) => {
      if (event.channel.label === WebRTCDataConnection._statsDataChannelLabel) {
        this._statsDataChannel = event.channel;
        this.listenOnStatsDataChannel();
      } else if (typeof superOnDataChannel === 'function') {
        superOnDataChannel.call(this._client, event);
      }
    };
  }

  public onMessage(message: Message) {
    if (message.getSubject() === MessageSubject.PING) {
      this.handlePing(message as Ping);
    } else if (message.getSubject() === MessageSubject.PONG) {
      this.handlePong(message as Pong);
    } else {
      super.onMessage(message);
    }
  }

  public onOpen() {
    super.onOpen(this);
    setInterval(() => {
      this._statsDataChannel.send(new Ping(this.getMyAddress(), this.getAddress(), this._pingSequence++).toString());
    }, 1000);
  }

  public establish(answer: SimplePeer.SignalData) {
    super.establish(answer);
    this._statsDataChannel = super.getRTCPeerConnection()
      .createDataChannel(
        WebRTCDataConnection._statsDataChannelLabel,
        {
          ordered: false,
          maxRetransmits: 0
        }
      );
    this.listenOnStatsDataChannel();
  }
}
