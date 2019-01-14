import * as SimplePeer from 'simple-peer';
import {Address} from '../message/address';
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
  private _pingInterval: any;

  private dataChannelSend(message: Message) {
    this._statsDataChannel.send(message.toString());
  }

  private sendPong(receiver: Address, sequence: number) {
    const pong = new Pong(
      this.getMyAddress(),
      receiver,
      sequence
    );
    this.dataChannelSend(pong);
  }

  private sendPing() {
    console.log(`Send ping to ${this.getAddress().getId()} ${this._pingSequence}`);
    const ping = new Ping(
      this.getMyAddress(),
      this.getAddress(),
      this._pingSequence++
    );
    this.dataChannelSend(ping);
  }

  private handlePing(message: Ping) {
    console.log(`Got ping from ${message.getSender().getId()} ${message.getBody()}`);
    this.sendPong(message.getSender(), message.getBody());
  }

  private handlePong(message: Pong) {
    console.log(`Got pong from ${message.getSender().getId()} ${message.getBody()}`);
    if (message.getBody() < this._pingSequence - 1) {
      console.error('Ping Packet get lost!');
    }
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

  public onClose() {
    super.onClose();
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }
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
    this._pingInterval = setInterval(() => {
      this.sendPing();
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
