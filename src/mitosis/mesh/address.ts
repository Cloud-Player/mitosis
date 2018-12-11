export class Address {

  private _version: string;
  private _peerId: number;
  private _protocol: string;
  private _payload: string;

  public constructor(version: string, peerId: number, protocol: string, payload: string) {
    this._version = version;
    this._peerId = peerId;
    this._protocol = protocol;
    this._payload = payload;
  }

  public static fromString(addressString: string): Address {
    const [mitosis, version, peer, peerId, protocol, payload] = addressString.split('/');
    return new Address(version, parseInt(peerId, 10), protocol, payload);
  }

  public getVersion(): string {
    return this._version;
  }

  public getPeerId(): number {
    return this._peerId;
  }

  public getProtocol(): string {
    return this._protocol;
  }

  public getPayload(): string {
    return this._payload;
  }

  public toString(): string {
    return `mitosis/${this.getVersion()}/peer/${this.getPeerId()}/${this.getProtocol()}/${this.getPayload()}`;
  }
}
