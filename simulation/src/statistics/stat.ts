import {IClock, IMessage} from 'mitosis';
import {IStatEv} from './stat-log-event';

export class Stat {
  private readonly clock: IClock;
  private ts: number;
  private totalMessageCount: number;
  private totalMessageSize: number;
  private messageCountForTs: number;
  private messageSizeForTs: number;

  constructor(clock: IClock) {
    this.clock = clock;
    this.ts = 0;
    this.totalMessageCount = 0;
    this.totalMessageSize = 0;
    this.messageCountForTs = 0;
    this.messageSizeForTs = 0;
  }

  public getMessageCountForTs(): number {
    return this.messageCountForTs;
  }

  public getMessageSizeForTs(): number {
    return this.messageSizeForTs;
  }

  public getTotalMessageCount(): number {
    return this.totalMessageCount;
  }

  public getTotalMessageSize(): number {
    return this.totalMessageSize;
  }

  public getTs(): number {
    return this.ts;
  }

  public getStat(): IStatEv {
    return {
      count: this.totalMessageCount,
      size: this.totalMessageSize,
      totalCount: this.totalMessageCount,
      totalSize: this.totalMessageSize
    };
  }

  updateTs(ts: number) {
    if (ts > this.ts) {
      this.ts = ts;
      this.messageCountForTs = 0;
      this.messageSizeForTs = 0;
    }
  }

  addMessage(message: IMessage) {
    this.messageCountForTs++;
    this.totalMessageCount++;
    this.messageSizeForTs += message.length;
    this.totalMessageSize += message.length;
  }

  clone() {
    const stat = new Stat(this.clock);
    stat.messageSizeForTs = this.messageSizeForTs;
    stat.messageCountForTs = this.messageCountForTs;
    stat.totalMessageCount = this.totalMessageCount;
    stat.totalMessageSize = this.totalMessageSize;
    return stat;
  }
}
