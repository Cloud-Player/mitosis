import {IClock, IMessage} from 'mitosis';
import {Stat} from './stat';

export class NetworkStats {
  private in: Stat;
  private out: Stat;

  constructor(clock: IClock) {
    this.in = new Stat(clock);
    this.out = new Stat(clock);
  }

  public addInComingMessage(message: IMessage) {
    this.in.addMessage(message);
  }

  public getIncomingStat(): Stat {
    return this.in.clone();
  }

  public addOutGoingMessage(message: IMessage) {
    this.out.addMessage(message);
  }

  public getOutgoingStat(): Stat {
    return this.out.clone();
  }

  public updateTs(ts: number) {
    this.in.updateTs(ts);
    this.out.updateTs(ts);
  }
}
