export function stringByteLength(value: string): number {
  // @ts-ignore
  if (process.browser) {
    return new Blob([value]).size;
  } else {
    return Buffer.byteLength(value);
  }
}

export function stringHashCode(value: string): number {
  return value
    .split('')
    .reduce((a, b) => {
        // tslint:disable:no-bitwise
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }
      , 0);
}
