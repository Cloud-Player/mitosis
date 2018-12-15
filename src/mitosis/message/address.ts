import {RoleType} from '../role/interface';
import {Protocol} from './interface';

export class Address {

  private _protocol: Protocol;
  private _identifier: string;
  private _version: string;

  public constructor(
    protocol: Protocol,
    identifier: string | RoleType,
    version: string = 'v1'
  ) {
    this._protocol = protocol;
    this._identifier = identifier;
    this._version = version;
  }

  public static fromString(addressString: string): Address {
    const segments = addressString.split('/');
    const [version, protocol] = segments.slice(1, 3);
    const identifier = segments.slice(3).join('/');
    return new Address(protocol as Protocol, identifier, version);
  }

  public getVersion(): string {
    return this._version;
  }

  public getIdentifier(): string {
    return this._identifier;
  }

  public getProtocol(): Protocol {
    return this._protocol;
  }

  public toString(): string {
    return [
      `mitosis/${this.getVersion()}`,
      `${this.getProtocol()}/${this.getIdentifier()}`,
    ].join('/');
  }
}
