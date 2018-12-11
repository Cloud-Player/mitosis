import {Address} from '../address/address';

export abstract class AbstractConnection {

  protected _address: Address;

  public constructor(address: Address) {
    this._address = address;
  }

  public getQuality(): number {
    return .0;
  }

  public getPeerId(): number {
    return this._address.getPeerId();
  }
}
