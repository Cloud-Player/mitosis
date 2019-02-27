import {Address, IClock, IWebRTCStreamConnectionOptions} from 'mitosis';
import {WebRTCMockConnection} from './webrtc-mock';

export class WebRTCStreamMockConnection extends WebRTCMockConnection {

  private _stream: MediaStream;
  private _streamPromise: Promise<MediaStream>;
  private _channelId: string;
  private _resolver: (stream: MediaStream) => void;

  constructor(address: Address, clock: IClock, options: IWebRTCStreamConnectionOptions) {
    super(address, clock, options);
    this._stream = options.stream;
  }

  protected createAnswer(mitosisId: string, options: IWebRTCStreamConnectionOptions) {
    this._channelId = options.channelId;
    super.createAnswer(mitosisId, options);
  }

  protected getAdditionalOfferPayload(): { [p: string]: any } {
    // TODO: Why doesn't it matter if id is any?
    return {channelId: this.getChannelId() || 'any'};
  }

  public getChannelId(): string {
    return (this._options as IWebRTCStreamConnectionOptions).channelId || this._channelId;
  }

  public setStream(stream: MediaStream): void {
    this._stream = stream;
    this._resolver(stream);
  }

  public getStream(): Promise<MediaStream> {
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
