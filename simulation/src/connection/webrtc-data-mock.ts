import {
  Address,
  ConnectionMeter,
  IClock,
  IConnection,
  IConnectionOptions,
  Logger,
  MasterClock,
  Message,
  MessageSubject,
  Protocol,
  WebRTCConnectionOptionsPayloadType
} from 'mitosis';
import {MockConnection} from './mock';

export class WebRTCDataMockConnection extends MockConnection implements IConnection {

  private _lastOffer = 1;
  private _lastAnswer = 1;
  private _clock: IClock;
  private _meter: ConnectionMeter;

  constructor(address: Address, options: IConnectionOptions) {
    super(address, options);
    if (options.clock) {
      this._clock = options.clock;
    } else {
      this._clock = new MasterClock();
      this._clock.start();
    }
    this._meter = new ConnectionMeter(this.getMyAddress(), address, this._clock);
    this._meter.observeMessages()
      .subscribe(this.send.bind(this));
  }

  private createOffer(mitosisId: string) {
    this._client.getClock().setTimeout(() => {
      Logger.getLogger(mitosisId).debug('webrtc offer ready');
      const offer = {
        type: 'offer',
        sdp: this._lastOffer++
      };
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
      Logger.getLogger(mitosisId).debug('webrtc answer ready');
      const answer = {
        type: 'answer',
        sdp: this._lastAnswer++
      };
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

  public onClose() {
    super.onClose();
    this._meter.stop();
  }

  public onOpen() {
    super.onOpen(this);
    this._meter.start();
  }

  public getQuality(): number {
    return Math.round(this._meter.getTq() * 100) / 100;
  }

  public establish(answer: number) {
    Logger.getLogger(this._options.mitosisId).debug('establish connection', answer);
    this._client.getClock().setTimeout(() => {
      this._client.establishConnection(this._address.getId(), this._options.mitosisId, this._address.getLocation());
    }, this.getConnectionDelay());
  }
}
