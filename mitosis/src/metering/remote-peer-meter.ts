import {IClock} from '../clock/interface';
import {IConnection} from '../connection/interface';
import {IMeter} from './interface';

export class RemotePeerMeter implements IMeter {

  private _clock: IClock;
  private readonly _connectionsPerAddress: Map<string, IConnection>;

  constructor(connectionsPerAddress: Map<string, IConnection>, clock: IClock) {
    this._connectionsPerAddress = connectionsPerAddress;
    this._clock = clock;
  }

  public getConnectionQuality(): number {
    return Array.from(this._connectionsPerAddress.values())
        .map(connection => connection.getMeter().getQuality())
        .reduce((previous, current) => previous + current, 0) /
      this._connectionsPerAddress.size;
  }

  public getQuality(): number {
    return this.getConnectionQuality();
  }

  public start(): void {
  }

  public stop(): void {
    this._clock.stop();
  }
}
