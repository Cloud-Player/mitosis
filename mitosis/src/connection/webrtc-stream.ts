import {Address} from '../message/address';
import {Message} from '../message/message';
import {IConnection, IConnectionOptions, Protocol} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCStreamConnection extends WebRTCConnection implements IConnection {

  protected static protocol: Protocol = Protocol.WEBRTC_STREAM;
  private _onStreamResolver: (stream: MediaStream) => void;
  private _onStreamPromise: Promise<MediaStream>;
  private _stream: MediaStream;

  constructor(address: Address, options: IConnectionOptions) {
    super(address, options);
    this._simplePeerOptions.stream = new MediaStream();
  }

  public send(message: Message): void {
    throw new Error('not implemented');
  }

  public addTrack(track: MediaStreamTrack): void {
    (this._client as any).addTrack(track, this._simplePeerOptions.stream);
  }

  protected bindClientListeners(): void {
    super.bindClientListeners();
    this._client.on('track', (track: MediaStreamTrack, stream: MediaStream) => {
      this._stream = stream;
      if (this._onStreamResolver) {
        this._onStreamResolver(this._stream);
      }
    });
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
