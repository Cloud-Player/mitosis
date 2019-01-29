import {IMeter} from 'mitosis';

export class MockMeter implements IMeter {

  private _quality: number;

  public constructor(quality: number = 1) {
    this._quality = quality;
  }

  public getQuality(): number {
    return this._quality;
  }

  public start(): void {
  }

  public stop(): void {
  }

}
