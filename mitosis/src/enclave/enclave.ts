export abstract class Enclave {
  private _privateKey: string;
  private _publicKey: string;

  constructor() {
    [this._publicKey, this._privateKey] = this._generateKeyPair();
  }

  protected abstract _generateKeyPair(): Array<string>;

  public getPublicKey(): string {
    return this._publicKey;
  }
}
