import {
  Address,
  ChurnType,
  IClock,
  IConnection,
  IStreamChurnEvent,
  IWebRTCStreamConnectionOptions,
  Logger,
  Message,
  StreamConnectionMeter
} from 'mitosis';
import {Subject} from 'rxjs';
import {WebRTCMockConnection} from './webrtc-mock';

export class WebRTCStreamMockConnection extends WebRTCMockConnection {

  private _streamSubject: Subject<IStreamChurnEvent>;
  private _channelId: string;
  private _stream: MediaStream;
  protected _meter: StreamConnectionMeter;

  constructor(address: Address, clock: IClock, options: IWebRTCStreamConnectionOptions) {
    super(address, clock, options);
    this._meter = new StreamConnectionMeter(this, clock);
    this._streamSubject = new Subject();
    this.setStream(options.stream);
  }

  private bindStreamListeners(): void {
    if (this._stream) {
      this._stream.onactive = () => {
        this._streamSubject.next({
          type: ChurnType.ADDED,
          stream: this._stream,
          channelId: this._channelId
        });
      };
      this._stream.oninactive = () => {
        this._streamSubject.next({
          type: ChurnType.REMOVED,
          stream: this._stream,
          channelId: this._channelId
        });
      };
    }
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

  public send(message: Message): void {
    Logger.getLogger(this._address.getId()).error('stream connection can not send messages', message);
  }

  public setStream(stream: MediaStream): void {
    this._stream = stream;
    this.bindStreamListeners();
    if (stream) {
      this._stream = stream;
      this._streamSubject.next({
        stream: this._stream,
        channelId: this._channelId,
        type: ChurnType.ADDED
      });
    } else {
      this.removeStream();
    }
  }

  public getStream(): MediaStream {
    return this._stream;
  }

  public removeStream(): void {
    if (this._stream) {
      const stream = this._stream;
      stream
        .getTracks()
        .forEach(
          track => track.stop()
        );
      this._stream = null;
      this._streamSubject.next({
        stream: stream,
        channelId: this._channelId,
        type: ChurnType.REMOVED
      });
    }
  }

  public onClose(reason?: any): void {
    this.removeStream();
    super.onClose(reason);
  }

  public observeStreamChurn(): Subject<IStreamChurnEvent> {
    return this._streamSubject;
  }
}
