import {Subject} from 'rxjs';
import {ChurnType} from '../interface';
import {IStreamChurnEvent} from './interface';

export class Provider {

  private readonly _peerId: string;
  private _stream: MediaStream;
  private _isSource: boolean;
  private _capacity: number;
  private _streamChurnSubject: Subject<IStreamChurnEvent>;

  constructor(peerId: string, capacity = 0) {
    this._peerId = peerId;
    this._capacity = capacity;
    this._streamChurnSubject = new Subject();
  }

  public isActive(): boolean {
    if (this._stream) {
      return this._stream.active;
    }
    return false;
  }

  public setIsSource(): void {
    this._isSource = true;
  }

  public setIsSink(): void {
    this._isSource = false;
  }

  public isSource(): boolean {
    if (this._stream) {
      return this._isSource;
    }
    return false;
  }

  public isSink(): boolean {
    if (this._stream) {
      return !this._isSource;
    }
    return false;
  }

  public isLive(): boolean {
    if (this._stream) {
      return this._stream
        .getTracks()
        .map(
          (track: MediaStreamTrack) => track.readyState === 'live'
        )
        .includes(true);
    }
    return false;
  }

  public isLocal(): boolean {
    if (this._stream) {
      return this._stream
        .getTracks()
        .map(
          (track: MediaStreamTrack) => !track.remote
        )
        .includes(true);
    }
    return false;
  }

  public getPeerId(): string {
    return this._peerId;
  }

  public getStreamId(): string {
    if (this._stream) {
      return this._stream.id;
    }
  }

  public getStream(): MediaStream {
    return this._stream;
  }

  public setStream(value: MediaStream): void {
    this._streamChurnSubject.next(
      {
        type: ChurnType.ADDED,
        stream: value,
        channelId: null
      }
    );
    this._stream = value;
  }

  public getCapacity(): number {
    return this._capacity;
  }

  public setCapacity(value: number): void {
    this._capacity = value;
  }

  public observeStreamChurn(): Subject<IStreamChurnEvent> {
    return this._streamChurnSubject;
  }

  public destroy(): void {
    if (this._stream) {
      this._stream
        .getTracks()
        .forEach(
          track => track.stop()
        );
      this._streamChurnSubject.next(
        {
          type: ChurnType.REMOVED,
          stream: this._stream,
          channelId: null
        }
      );
      this._stream = null;
    }
    this._streamChurnSubject.complete();
  }

  public toString(): string {
    return JSON.stringify({
        id: this._peerId,
        capacity: this._capacity,
        stream: this.getStreamId(),
        active: this.isActive(),
        live: this.isLive(),
        local: this.isLocal()
      },
      undefined,
      2
    );
  }
}
