import {IClock} from '../clock/interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {StreamConnectionMeter} from '../metering/connection-meter/stream-connection-meter';
import {IMediaStream} from '../stream/interface';
import {IConnection, IWebRTCStreamConnectionOptions} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCStreamConnection extends WebRTCConnection implements IConnection {

  private _onStreamResolver: (stream: IMediaStream) => void;
  private _onStreamPromise: Promise<IMediaStream>;
  private _stream: IMediaStream;

  constructor(address: Address, clock: IClock, options: IWebRTCStreamConnectionOptions) {
    super(address, clock, options);
    this._meter = new StreamConnectionMeter(this, clock);
    this._simplePeerOptions.stream = (options.stream as unknown as MediaStream);
  }

  protected bindClientListeners(): void {
    super.bindClientListeners();
    this._client.on('track', (track: MediaStreamTrack, stream: IMediaStream) => {
      this._stream = stream;
      if (this._onStreamResolver) {
        this._onStreamResolver(this._stream);
      }
    });

    this._client.on('stream', (stream: IMediaStream) => {
      this._stream = stream;
      if (this._onStreamResolver) {
        this._onStreamResolver(this._stream);
      }
    });
  }

  public send(message: Message): void {
    Logger.getLogger(message.getSender().getId()).error('stream connection can not send messages', message);
  }

  public addTrack(track: MediaStreamTrack): void {
    (this._client as any).addTrack(track, this._stream);
  }

  public setStream(stream: IMediaStream): void {
    this._stream = stream;
    this._simplePeerOptions.stream = (stream as unknown as MediaStream);
  }

  public getStream(): Promise<IMediaStream> {
    if (this._stream) {
      return Promise.resolve(this._stream);
    } else if (!this._onStreamPromise) {
      this._onStreamPromise = new Promise<IMediaStream>(
        resolve => {
          this._onStreamResolver = resolve;
        }
      );
    }
    return this._onStreamPromise;
  }
}
