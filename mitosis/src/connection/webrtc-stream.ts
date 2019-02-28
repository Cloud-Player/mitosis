import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {StreamConnectionMeter} from '../metering/connection-meter/stream-connection-meter';
import {IStreamChurnEvent} from '../stream/interface';
import {IConnection, IWebRTCStreamConnectionOptions} from './interface';
import {WebRTCConnection} from './webrtc';

export class WebRTCStreamConnection extends WebRTCConnection implements IConnection {

  private _streamSubject: Subject<IStreamChurnEvent>;
  private _channelId: string;
  private _stream: MediaStream;

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

  protected closeClient(): void {
    this.removeStream();
    super.closeClient();
  }

  protected bindClientListeners(): void {
    super.bindClientListeners();
    this._client.on('track', (track: MediaStreamTrack, stream: MediaStream) => {
      this.setStream(stream);
    });
    this._client.on('stream', (stream: MediaStream) => {
      this.setStream(stream);
    });
    this.getRTCPeerConnection().addEventListener('onremovestream', () => {
      this.removeStream();
    });
  }

  public send(message: Message): void {
    Logger.getLogger(message.getSender().getId()).error('stream connection can not send messages', message);
  }

  public getChannelId(): string {
    return (this._options as IWebRTCStreamConnectionOptions).channelId || this._channelId;
  }

  public setStream(stream: MediaStream): void {
    if (stream) {
      this._stream = stream;
      this._simplePeerOptions.stream = stream;
      this.bindStreamListeners();
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

  public observeStreamChurn(): Subject<IStreamChurnEvent> {
    return this._streamSubject;
  }
}
