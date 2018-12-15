import * as SimplePeer from 'simple-peer';
import {Address} from '../message/address';
import {MessageSubject, Protocol} from '../message/interface';
import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {IConnection, IWebRTCConnectionOptions, WebRTCConnectionOptionsPayloadType} from './interface';

export class WebRTCConnection extends AbstractConnection implements IConnection {

  private _webrtc: SimplePeer.Instance;
  protected _options: IWebRTCConnectionOptions;

  public send(message: Message): void {
    this._webrtc.send(message.toString());
  }

  protected closeClient(): void {
    this._webrtc.destroy();
    this._webrtc = null;
    this.onClose();
  }

  protected openClient(): void {
    if (!this._options) {
      throw  new Error('cannot open without options');
    }
    if (this._options.payload) {
      switch (this._options.payload.type) {
        case WebRTCConnectionOptionsPayloadType.OFFER:
          this.createAnswer(this._options.mitosisId, this._options.payload);
          break;
        case WebRTCConnectionOptionsPayloadType.ANSWER:
          this.establish(this._options.payload);
          break;
        default:
          throw new Error(
            `unsupported webrtc connection options payload type ${this._options.payload.type}`
          );
      }
    } else {
      this.createOffer(this._options.mitosisId);
    }

    this._webrtc.on('connect', () => {
      console.log('webrtc connection is established!');
      this.onOpen(this);
    });
    this._webrtc.on('data', (data) => {
      this.onMessage(Message.fromString(data));
    });
    this._webrtc.on('error', (error) => {
      console.error(error);
    });
  }

  private createOffer(mitosisId: string) {
    this._webrtc = new SimplePeer({initiator: true, trickle: false});
    this._webrtc.on('signal', (offer: SimplePeer.SignalData) => {
      console.log('webrtc offer ready');
      this.onMessage(new Message(
        new Address(mitosisId, Protocol.WEBRTC, this.getId()),
        this.getAddress(),
        MessageSubject.CONNECTION_NEGOTIATION,
        offer
      ));
    });
  }

  private createAnswer(mitosisId: string, offer: SimplePeer.SignalData) {
    this._webrtc = new SimplePeer({initiator: false, trickle: false});
    this._webrtc.signal(offer);
    this._webrtc.on('signal', (answer: SimplePeer.SignalData) => {
      console.log('webrtc answer ready');
      this.onMessage(new Message(
        new Address(mitosisId, Protocol.WEBRTC, this.getId()),
        new Address(this.getAddress().getId()),
        MessageSubject.CONNECTION_NEGOTIATION,
        answer
      ));
    });
  }

  public establish(answer: SimplePeer.SignalData) {
    this._webrtc.signal(answer);
    console.log('establishing webrtc connection');
  }
}
