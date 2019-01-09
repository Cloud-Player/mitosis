import * as SimplePeer from 'simple-peer';
import {Address} from '../message/address';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {
  ConnectionState,
  IConnection,
  IWebRTCConnectionOptions,
  Protocol,
  WebRTCConnectionOptionsPayloadType
} from './interface';

export class WebRTCConnection extends AbstractConnection implements IConnection {

  private _client: SimplePeer.Instance;
  protected _options: IWebRTCConnectionOptions;

  public send(message: Message): void {
    if (!this._client) {
      throw new Error('webrtc client not initialized');
    } else if (this.getState() !== ConnectionState.OPEN) {
      throw new Error(`webrtc connection not in open state (${this.getState()})`);
    } else {
      this._client.send(message.toString());
    }
  }

  protected closeClient(): void {
    this._client.destroy();
    this._client = null;
  }

  protected openClient(): void {
    if (!this._options) {
      throw  new Error('webrtc cannot be opened without options');
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
            `webrtc options unsupported ${this._options.payload.type}`
          );
      }
    } else {
      this.createOffer(this._options.mitosisId);
    }

    this._client.on('connect', () => {
      this.onOpen(this);
    });
    this._client.on('data', (data) => {
      this.onMessage(Message.fromString(data));
    });
    this._client.on('close', () => {
      this.onClose();
    });
    this._client.on('error', (error) => {
      this.onError(error);
    });
  }

  private createOffer(mitosisId: string) {
    this._client = new SimplePeer({initiator: true, trickle: false});
    this._client.on('signal', (offer: SimplePeer.SignalData) => {
      console.debug('webrtc offer ready');
      this.onMessage(new Message(
        new Address(mitosisId, Protocol.WEBRTC, this.getId()),
        this.getAddress(),
        MessageSubject.CONNECTION_NEGOTIATION,
        offer
      ));
    });
  }

  private createAnswer(mitosisId: string, offer: SimplePeer.SignalData) {
    this._client = new SimplePeer({initiator: false, trickle: false});
    this._client.signal(offer);
    this._client.on('signal', (answer: SimplePeer.SignalData) => {
      console.debug('webrtc answer ready');
      this.onMessage(new Message(
        new Address(mitosisId, Protocol.WEBRTC, this.getId()),
        new Address(this.getAddress().getId()),
        MessageSubject.CONNECTION_NEGOTIATION,
        answer
      ));
    });
  }

  public getQuality(): number {
    return 1.0;
  }

  public establish(answer: SimplePeer.SignalData) {
    this._client.signal(answer);
    console.debug('webrtc connection negotiating');
  }
}
