import {IClock, IMessage} from 'mitosis';
import {Stat} from './stat';

export class NetworkStats {

  private _clock: IClock;
  private _in: Stat;
  private _out: Stat;

  constructor(clock: IClock) {
    this._clock = clock;
    this.reset();
  }

  public reset(): void {
    this._in = new Stat(this._clock);
    this._out = new Stat(this._clock);
  }

  public addInComingMessage(message: IMessage): void {
    this._in.addMessage(message);
  }

  public getIncomingStat(): Stat {
    return this._in.clone();
  }

  public addOutGoingMessage(message: IMessage) {
    this._out.addMessage(message);
  }

  public getOutgoingStat(): Stat {
    return this._out.clone();
  }

  public updateTs(ts: number): void {
    this._in.updateTs(ts);
    this._out.updateTs(ts);
  }
}
