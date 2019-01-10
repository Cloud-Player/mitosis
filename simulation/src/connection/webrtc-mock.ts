import {
  Address,
  IConnection,
  Logger,
  Message,
  MessageSubject,
  Protocol,
  WebRTCConnectionOptionsPayloadType
} from 'mitosis';
import {MockConnection} from './mock';

export class WebRTCMockConnection extends MockConnection implements IConnection {

  private _lastOffer = 1;
  private _lastAnswer = 1;
  private _signalDelay = 1;
  private _quality = (Math.floor(Math.random() * 50) / 100) + 0.5;

  protected openClient(): void {
    if (!this._options) {
      throw  new Error('webrtc cannot be opened without options');
    }
    if (this._options.payload) {
      switch (this._options.payload.type) {
        case WebRTCConnectionOptionsPayloadType.OFFER:
          Logger.getLogger(this._options.mitosisId).debug('create answer', this._options.payload);
          this.createAnswer(this._options.mitosisId, this._options.payload);
          break;
        case WebRTCConnectionOptionsPayloadType.ANSWER:
          Logger.getLogger(this._options.mitosisId).debug('establish', this._options.payload);
          this.establish(this._options.payload);
          break;
        default:
          Logger.getLogger(this._options.mitosisId).debug('no type found', this._options.payload);
          throw new Error(
            `webrtc options unsupported ${this._options.payload.type}`
          );
      }
    } else {
      this.createOffer(this._options.mitosisId);
    }
  }

  private createOffer(mitosisId: string) {
    this._client.getClock().setTimeout(() => {
      Logger.getLogger(mitosisId).debug('webrtc offer ready');
      const offer = {
        type: 'offer',
        sdp: this._lastOffer++
      };
      const offerMsg = new Message(
        new Address(mitosisId, Protocol.WEBRTC, this.getId()),
        this.getAddress(),
        MessageSubject.CONNECTION_NEGOTIATION,
        offer
      );
      this.onMessage(offerMsg);
    }, this._signalDelay);
  }

  private createAnswer(mitosisId: string, offer: number) {
    this._client.getClock().setTimeout(() => {
      Logger.getLogger(mitosisId).debug('webrtc answer ready');
      const answer = {
        type: 'answer',
        sdp: this._lastAnswer++
      };
      const answerMsg = new Message(
        new Address(mitosisId, Protocol.WEBRTC, this.getId()),
        new Address(this.getAddress().getId()),
        MessageSubject.CONNECTION_NEGOTIATION,
        answer
      );
      this.onMessage(answerMsg);
    }, this._signalDelay);
  }

  public getQuality(): number {
    return this._quality;
  }

  public establish(answer: number) {
    Logger.getLogger(this._options.mitosisId).debug('establish connection', answer);
    this._client.getClock().setTimeout(() => {
      this._client.addConnection(this._address.getId(), this._options.mitosisId, this);
      this._client.addConnection(this._options.mitosisId, this._address.getId(), this);
      this.onOpen(this);
    }, this._signalDelay);
  }
}
