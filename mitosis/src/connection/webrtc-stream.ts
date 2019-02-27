import {IClock} from '../clock/interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {StreamConnectionMeter} from '../metering/connection-meter/stream-connection-meter';
import {IConnection, IWebRTCStreamConnectionOptions} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCStreamConnection extends WebRTCConnection implements IConnection {

  private _onStreamResolver: (stream: MediaStream) => void;
  private _onStreamPromise: Promise<MediaStream>;
  private _channelId: string;
  private _stream: MediaStream;

  constructor(address: Address, clock: IClock, options: IWebRTCStreamConnectionOptions) {
    super(address, clock, options);
    this._meter = new StreamConnectionMeter(this, clock);
    this._simplePeerOptions.stream = options.stream;
  }

  protected bindClientListeners(): void {
    super.bindClientListeners();
    this._client.on('track', (track: MediaStreamTrack, stream: MediaStream) => {
      this._stream = stream;
      if (this._onStreamResolver) {
        this._onStreamResolver(this._stream);
      }
    });

    this._client.on('stream', (stream: MediaStream) => {
      this._stream = stream;
      if (this._onStreamResolver) {
        this._onStreamResolver(this._stream);
      }
    });
  }

  protected createAnswer(mitosisId: string, options: IWebRTCStreamConnectionOptions) {
    this._channelId = options.channelId;
    super.createAnswer(mitosisId, options);
  }

  protected getAdditionalOfferPayload(): { [p: string]: any } {
    // TODO: Why doesn't it matter if id is any?
    return {channelId: this.getChannelId() || 'any'};
  }

  }

  public send(message: Message): void {
    Logger.getLogger(message.getSender().getId()).error('stream connection can not send messages', message);
  }

  public getChannelId(): string {
    return (this._options as IWebRTCStreamConnectionOptions).channelId || this._channelId;
  }

  public setStream(stream: MediaStream): void {
    this._stream = stream;
    this._simplePeerOptions.stream = stream;
  }

  public getStream(): Promise<MediaStream> {
    if (this._stream) {
      return Promise.resolve(this._stream);
    } else if (!this._onStreamPromise) {
      this._onStreamPromise = new Promise<MediaStream>(
        resolve => {
          this._onStreamResolver = resolve;
        }
      );
    }
    return this._onStreamPromise;
  }
}
