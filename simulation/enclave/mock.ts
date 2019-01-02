export class MockEnclave implements IEnclave {

  public getPublicKey(): string {
    return 'public';
  }

  public decrypt(data: Uint8Array): Uint8Array {
    return data;
  }

  public encrypt(data: Uint8Array, publicKey: string): Uint8Array {
    return data;
  }

  public sign(data: Uint8Array): Uint8Array {
    return data;
  }

  public verify(data: Uint8Array): boolean {
    return true;
  }
}
