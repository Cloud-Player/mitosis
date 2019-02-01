import {ConnectionMeter, IClock, IConnection, IConnectionMeter} from 'mitosis';

export class MockMeter extends ConnectionMeter implements IConnectionMeter {

  private _quality: number;
  protected _clock: IClock;

  public constructor(connection: IConnection, clock: IClock, quality: number = 1) {
    super(connection, clock);
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
