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
    console.log(`[${message.getReceiver().getId()}<-${message.getSender().getId()}] Ding!`, message.getSubject(), message.length);
    this.in.addMessage(message);
  }

  public getIncomingStat(): Stat {
    return this.in.clone();
  }

  public addOutGoingMessage(message: IMessage) {
    console.log(`[${message.getSender().getId()}->${message.getReceiver().getId()}] Dong!`, message.getSubject(), message.length);
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
