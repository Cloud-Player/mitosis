import * as SimplePeer from 'simple-peer';
import {IClock} from '../clock/interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {ConnectionNegotiationType} from '../message/connection-negotiation';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {ConnectionState, IConnection, IConnectionOptions, IWebRTCConnectionOptions, NegotiationState} from './interface';

export abstract class WebRTCConnection extends AbstractConnection implements IConnection {

  protected _client: SimplePeer.Instance;
  protected _options: IWebRTCConnectionOptions;
  protected _simplePeerOptions: SimplePeer.Options;

  constructor(address: Address, clock: IClock, options: IConnectionOptions) {
    super(address, clock, options);
    this._simplePeerOptions = {trickle: false};
  }

  private createOffer(mitosisId: string) {
    this._negotiationState = NegotiationState.WAITING_FOR_OFFER;
    this._simplePeerOptions.initiator = true;
    this._client = new SimplePeer(this._simplePeerOptions);
    this._client.on('signal', (offer: SimplePeer.SignalData) => {
      const body = Object.assign(offer, this.getAdditionalOfferPayload());
      Logger.getLogger(mitosisId)
        .debug(`webrtc offer for ${this.getAddress().getId()} ready`, JSON.stringify(offer));
      this.onMessage(new Message(
        this.getMyAddress(),
        new Address(this.getAddress().getId()),
        MessageSubject.CONNECTION_NEGOTIATION,
        body
      ));
      this._negotiationState = NegotiationState.WAITING_FOR_ANSWER;
    });
  }

  protected createAnswer(mitosisId: string, options: IWebRTCConnectionOptions) {
    const offer: SimplePeer.SignalData = options.payload;
    this._negotiationState = NegotiationState.WAITING_FOR_ANSWER;
    this._simplePeerOptions.initiator = false;
    this._client = new SimplePeer(this._simplePeerOptions);
    this._client.signal(offer);
    this._client.on('signal', (answer: SimplePeer.SignalData) => {
      Logger.getLogger(mitosisId)
        .debug(`webrtc answer for ${this.getAddress().getId()} ready`, JSON.stringify(answer));
      this.onMessage(new Message(
        this.getMyAddress(),
        new Address(this.getAddress().getId()),
        MessageSubject.CONNECTION_NEGOTIATION,
        answer
      ));
      this._negotiationState = NegotiationState.WAITING_FOR_ESTABLISH;
    });
  }

  protected abstract getAdditionalOfferPayload(): { [key: string]: any };

  protected getMyAddress(): Address {
    return new Address(this._options.mitosisId, this.getAddress().getProtocol(), this.getId());
  }

  protected getRTCPeerConnection(): RTCPeerConnection {
    if (this._client) {
      // @ts-ignore
      return this._client._pc;
    }
  }

  protected getStats(): Promise<Array<RTCStats>> {
    const rtcpc = this.getRTCPeerConnection();
    if (!rtcpc) {
      return Promise.reject(`no stats for missing connection to ${this.getMyAddress().getId()}`);
    }
    return new Promise<Array<RTCStats>>(resolve => {
      rtcpc.getStats()
        .then((report: RTCStatsReport) => {
          const statsArray: Array<RTCStats> = [];
          report.forEach((stats: RTCStats) => {
            statsArray.push(stats);
          });
          resolve(statsArray);
        });
    });
  }

  protected closeClient(): void {
    if (this._client) {
      this._client.destroy();
      this._client = null;
    } else {
      this.onClose('webrtc peer connection was closed and no client exists; probably other client has closed');
    }
  }

  protected bindClientListeners(): void {
    this._client.on('connect', () => {
      this.onOpen(this);
    });
    this._client.on('data', (data: string) => {
      this.onMessage(Message.fromString(data));
    });
    this._client.on('close', () => {
      this.onClose('webrtc peer connection close');
    });
    this._client.on('error', (error) => {
      this.onError(error);
    });
  }

  protected openClient(): void {
    if (!this._options) {
      throw  new Error('webrtc cannot be opened without options');
    }
    if (this._options.payload) {
      switch (this._options.payload.type) {
        case ConnectionNegotiationType.OFFER:
          this.createAnswer(this._options.mitosisId, this._options);
          break;
        case ConnectionNegotiationType.ANSWER:
          this.establish(this._options);
          break;
        default:
          throw new Error(
            `webrtc options unsupported ${this._options.payload.type}`
          );
      }
    } else {
      this.createOffer(this._options.mitosisId);
    }
    this.bindClientListeners();
  }

  public isInitiator(): boolean {
    return this._simplePeerOptions.initiator;
  }

  public send(message: Message): void {
    if (!this._client) {
      throw new Error(`webrtc client not initialized`);
    } else if (this.getState() !== ConnectionState.OPEN) {
      throw new Error(`webrtc cannot send to ${this.getState()} connection`);
    } else {
      this._client.send(message.toString());
    }
  }

  public establish(options: IWebRTCConnectionOptions) {
    const answer: SimplePeer.SignalData = options.payload;
    Logger.getLogger(this._options.mitosisId)
      .debug(`webrtc answer for ${this.getAddress().getId()} negotiating`, JSON.stringify(answer));
    this._client.signal(answer);
  }
}
