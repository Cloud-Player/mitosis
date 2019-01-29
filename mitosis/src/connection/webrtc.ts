import * as SimplePeer from 'simple-peer';
import {IClock} from '../clock/interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {ConnectionState, IConnection, IConnectionOptions, IWebRTCConnectionOptions, WebRTCConnectionOptionsPayloadType} from './interface';

export abstract class WebRTCConnection extends AbstractConnection implements IConnection {

  protected _client: SimplePeer.Instance;
  protected _options: IWebRTCConnectionOptions;
  protected _simplePeerOptions: SimplePeer.Options;

  constructor(address: Address, clock: IClock, options: IConnectionOptions) {
    super(address, clock, options);
    this._simplePeerOptions = {initiator: true, trickle: false};
  }

  private createOffer(mitosisId: string) {
    this._client = new SimplePeer(this._simplePeerOptions);
    this._client.on('signal', (offer: SimplePeer.SignalData) => {
      Logger.getLogger(mitosisId).debug('webrtc offer ready');
      this.onMessage(new Message(
        this.getMyAddress(),
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
      Logger.getLogger(mitosisId).debug('webrtc answer ready');
      this.onMessage(new Message(
        this.getMyAddress(),
        new Address(this.getAddress().getId()),
        MessageSubject.CONNECTION_NEGOTIATION,
        answer
      ));
    });
  }

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
      return Promise.reject();
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
    this._client.destroy();
    this._client = null;
  }

  protected bindClientListeners(): void {
    this._client.on('connect', () => {
      this.onOpen(this);
    });
    this._client.on('data', (data: string) => {
      this.onMessage(Message.fromString(data));
    });
    this._client.on('close', () => {
      this.onClose();
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
    this.bindClientListeners();
  }

  public send(message: Message): void {
    if (!this._client) {
      throw new Error('webrtc client not initialized');
    } else if (this.getState() !== ConnectionState.OPEN) {
      throw new Error(`webrtc connection not in open state (${this.getState()})`);
    } else {
      this._client.send(message.toString());
    }
  }

  public establish(answer: SimplePeer.SignalData) {
    Logger.getLogger(this._options.mitosisId).debug('webrtc connection negotiating');
    this._client.signal(answer);
  }
}
