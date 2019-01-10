import {
  Address,
  IConnection,
  Message, MessageSubject, Protocol,
  WebRTCConnectionOptionsPayloadType
} from 'mitosis';
import {MockConnection} from './mock';

export class WebRTCMockConnection extends MockConnection implements IConnection {
  private _lastOffer = 1;
  private _lastAnswer = 1;
  private _signalDelay = 1;

  protected openClient(): void {
    if (!this._options) {
      throw  new Error('webrtc cannot be opened without options');
    }
    if (this._options.payload) {
      switch (this._options.payload.type) {
        case WebRTCConnectionOptionsPayloadType.OFFER:
          console.log('CREATE ANSWER', this._options.payload);
          this.createAnswer(this._options.mitosisId, this._options.payload);
          break;
        case WebRTCConnectionOptionsPayloadType.ANSWER:
          console.log('ESTABLISH', this._options.payload);
          this.establish(this._options.payload);
          break;
        default:
          console.log('NO TYPE FOUND', this._options.payload);
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
      console.debug('webrtc offer ready');
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
      this._client.addConnection(this._address.getId(), this._options.mitosisId, this);
      this.onMessage(offerMsg);
    }, this._signalDelay);
  }

  private createAnswer(mitosisId: string, offer: number) {
    this._client.getClock().setTimeout(() => {
      console.debug('webrtc answer ready');
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
      this._client.addConnection(this._address.getId(), this._options.mitosisId, this);
      this.onMessage(answerMsg);
    }, this._signalDelay);
  }

  public getQuality(): number {
    return 1.0;
  }

  public establish(answer: number) {
    console.log('ESTABLISH CONNECTION', answer);
    this._client.getClock().setTimeout(() => {
      this._client.establishConnection(this._address.getId(), this._options.mitosisId);
    }, this._signalDelay);
  }
}
