import {Protocol} from './interface';

export class Address {

  private _id: string;
  private _protocol: Protocol;
  private _location: string;
  private _version: string;

  public constructor(
    id: string,
    protocol?: Protocol,
    location?: string,
    version: string = 'v1'
  ) {
    this._id = id;
    this._protocol = protocol;
    this._location = location;
    this._version = version;
  }

  public static fromString(addressString: string): Address {
    const segments = addressString.split('/');
    const [version, id, protocol] = segments.slice(1, 4);
    const location = segments.slice(4).join('/');
    return new Address(id, protocol as Protocol, location, version);
  }

  public getId(): string {
    return this._id;
  }

  public getProtocol(): Protocol {
    return this._protocol;
  }

  public getLocation(): string {
    return this._location;
  }

  public setLocation(location: string): void {
    this._location = location;
  }

  public getVersion(): string {
    return this._version;
  }

  public toString(): string {
    const segments = [
      'mitosis',
      this.getVersion(),
      this.getId(),
      this.getProtocol(),
      this.getLocation()
    ].filter(value => value !== undefined);
    return segments.join('/');
  }

  public matches(other: Address): boolean {
    return (
      this.getId() === other.getId() &&
      this.getProtocol() === other.getProtocol() &&
      this.getVersion() === other.getVersion()
    );
  }
}
