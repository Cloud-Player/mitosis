export function stringByteLength(value: string): number {
  // @ts-ignore
  if (process.browser) {
    return new Blob([value]).size;
  } else {
    return Buffer.byteLength(value);
  }
}
