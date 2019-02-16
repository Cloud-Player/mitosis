import {IClock} from '../clock/interface';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {StreamConnectionMeter} from '../metering/connection-meter/stream-connection-meter';
import {IConnection, IConnectionOptions} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCStreamConnection extends WebRTCConnection implements IConnection {

  private _onStreamResolver: (stream: MediaStream) => void;
  private _onStreamPromise: Promise<MediaStream>;
  private _stream: MediaStream;

  constructor(address: Address, clock: IClock, options: IConnectionOptions) {
    super(address, clock, options);
    this._meter = new StreamConnectionMeter(this, clock);
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

  public send(message: Message): void {
    throw new Error('not implemented');
  }

  public addTrack(track: MediaStreamTrack): void {
    (this._client as any).addTrack(track, this._stream);
  }

  public setStream(stream: MediaStream): void {
    this._stream = stream;
    this._simplePeerOptions.stream = stream;
    stream
      .getTracks()
      .forEach(
        track => this.addTrack(track)
      );
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
