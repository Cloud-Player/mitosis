interface IEnclave {
  getPublicKey(): string;

  encrypt(data: Uint8Array, publicKey: string): Uint8Array;

  decrypt(data: Uint8Array): Uint8Array;

  sign(data: Uint8Array): Uint8Array;

  verify(data: Uint8Array): boolean;
}
