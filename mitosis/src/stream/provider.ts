export class Provider {

  private readonly _peerId: string;
  private _stream: MediaStream;
  private _capacity: number;

  constructor(peerId: string, stream?: MediaStream, capacity = 0) {
    this._peerId = peerId;
    this._stream = stream;
    this._capacity = capacity;
  }

  public isActive(): boolean {
    if (this._stream) {
      return this._stream.active;
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
    if (this._stream) {
      this._stream.getTracks()
        .forEach(
          track => track.stop()
        );
    }
  }
}
