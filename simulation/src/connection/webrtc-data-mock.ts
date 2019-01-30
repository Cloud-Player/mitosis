import {
  Address,
  IClock,
  IConnection,
  IConnectionOptions,
  Logger,
  Message,
  MessageSubject,
  Protocol,
  TransmissionConnectionMeter,
  WebRTCConnectionOptionsPayloadType
} from 'mitosis';
import {MockConnection} from './mock';

export class WebRTCDataMockConnection extends MockConnection implements IConnection {

  private _lastOffer = 1;
  private _lastAnswer = 1;
  protected _meter: TransmissionConnectionMeter;

  constructor(address: Address, clock: IClock, options: IConnectionOptions) {
    super(address, clock, options);
    this._meter = new TransmissionConnectionMeter(
      this,
      this.getMyAddress(),
      address,
      this._clock);
    this._meter.observeMessages()
      .subscribe(this.send.bind(this));
  }

  private createOffer(mitosisId: string) {
    this._client.getClock().setTimeout(() => {
      const offer = {
        type: 'offer',
        sdp: this._lastOffer++
      };
      Logger.getLogger(mitosisId).debug('webrtc offer ready', JSON.stringify(offer));
      const offerMsg = new Message(
        new Address(mitosisId, Protocol.WEBRTC_DATA, this.getId()),
        this.getAddress(),
        MessageSubject.CONNECTION_NEGOTIATION,
        offer
      );
      this._client.addConnection(
        this._options.mitosisId,
        this._address.getId(),
        this._address.getLocation(),
        this);
      this.onMessage(offerMsg);
    }, this.getConnectionDelay());
  }

  private createAnswer(mitosisId: string, offer: number) {
    this._client.getClock().setTimeout(() => {
      const answer = {
        type: 'answer',
        sdp: this._lastAnswer++
      };
      Logger.getLogger(mitosisId).debug('webrtc answer ready', JSON.stringify(answer));
      const answerMsg = new Message(
        new Address(mitosisId, Protocol.WEBRTC_DATA, this.getId()),
        new Address(this.getAddress().getId()),
        MessageSubject.CONNECTION_NEGOTIATION,
        answer
      );
      this._client.addConnection(
        this._options.mitosisId,
        this._address.getId(),
        this._address.getLocation(),
        this);
      this.onMessage(answerMsg);
    }, this.getConnectionDelay());
  }

  protected openClient(): void {
    if (!this._options) {
      throw  new Error('webrtc cannot be opened without options');
    }
    if (this._options.payload) {
      switch (this._options.payload.type) {
        case WebRTCConnectionOptionsPayloadType.OFFER:
          Logger.getLogger(this._options.mitosisId).debug('create answer for', this._address.getId());
          this.createAnswer(this._options.mitosisId, this._options.payload);
          break;
        case WebRTCConnectionOptionsPayloadType.ANSWER:
          Logger.getLogger(this._options.mitosisId).debug('establish connection to', this._address.getId());
          this.establish(this._options.payload);
          break;
        default:
          Logger.getLogger(this._options.mitosisId).debug('no type found', this._options.payload.type);
          throw new Error(
            `webrtc options unsupported ${this._options.payload.type}`
          );
      }
    } else {
      this.createOffer(this._options.mitosisId);
    }
  }

  protected getMyAddress(): Address {
    return new Address(this._options.mitosisId, this.getAddress().getProtocol(), this.getId());
  }

  public onMessage(message: Message) {
    Logger.getLogger(this.getMyAddress().getId())
      .info(`got ${message.getSubject()} from ${message.getSender().getId()}`, message.toString());
    if (
      message.getSubject() === MessageSubject.PING ||
      message.getSubject() === MessageSubject.PONG
    ) {
      this._meter.onMessage(message);
    } else {
      super.onMessage(message);
    }
  }

  public establish(answer: { type: string, sdp: number }) {
    Logger.getLogger(this._options.mitosisId).debug('establish mock connection', JSON.stringify(answer));
    this._client.getClock().setTimeout(() => {
      this._client.establishConnection(this._address.getId(), this._options.mitosisId, this._address.getLocation());
    }, this.getConnectionDelay());
  }
}
