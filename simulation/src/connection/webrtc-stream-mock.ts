import {Address, IClock, IMediaStream, IWebRTCStreamConnectionOptions} from 'mitosis';
import {WebRTCMockConnection} from './webrtc-mock';

export class WebRTCStreamMockConnection extends WebRTCMockConnection {

  private _stream: IMediaStream;
  private _streamPromise: Promise<IMediaStream>;
  private _resolver: (stream: IMediaStream) => void;

  constructor(address: Address, clock: IClock, options: IWebRTCStreamConnectionOptions) {
    super(address, clock, options);
    this._stream = options.stream;
  }

  public setStream(stream: IMediaStream): void {
    this._stream = stream;
    this._resolver(stream);
  }

  public getStream(): Promise<IMediaStream> {
    if (this._stream) {
      return Promise.resolve(this._stream);
    }
    if (!this._streamPromise) {
      this._streamPromise = new Promise(resolver => {
        this._resolver = resolver;
      });
    }
    return this._streamPromise;
  }
}
