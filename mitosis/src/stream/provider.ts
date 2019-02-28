export class Provider {

  private readonly _peerId: string;
  private _stream: MediaStream;
  private _capacity: number;

  constructor(peerId: string, capacity = 0) {
    this._peerId = peerId;
    this._capacity = capacity;
  }

  public isActive(): boolean {
    if (this._stream) {
      return this._stream.active;
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

  public getStream(): MediaStream {
    return this._stream;
  }

  public setStream(value: MediaStream): void {
    this._stream = value;
  }

  public getCapacity(): number {
    return this._capacity;
  }

  public setCapacity(value: number): void {
    this._capacity = value;
  }

  public destroy(): void {
    this._stream.getTracks()
      .forEach(
        track => track.stop()
      );
  }
}
