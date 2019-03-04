import {ConfigurationMap} from '../configuration';

export class RouterAliveHighscore {
  private _rankPerSequenceMap: Map<number, number>;

  constructor() {
    this._rankPerSequenceMap = new Map();
  }

  public get length(): number {
    return this._rankPerSequenceMap.size;
  }

  private getHighestSequence() {
    return Array
      .from(this._rankPerSequenceMap.keys())
      .sort((a, b) => a - b)
      .pop();
  }

  private cleanUpOldSequences() {
    const highestSequence = this.getHighestSequence();
    const removeKeys = Array
      .from(this._rankPerSequenceMap.keys())
      .filter(
        key => highestSequence - key >= ConfigurationMap.getDefault().ROUTER_ALIVE_HIGHSCORE_WINDOW_SIZE
      );
    removeKeys
      .forEach(
        key => {
          this._rankPerSequenceMap.delete(key);
        }
      );
  }

  public addSequence(sequence: number): void {
    this._rankPerSequenceMap.set(sequence, null);
    this.cleanUpOldSequences();
  }

  public setRankForSequence(sequence: number, rank: number): void {
    const rankPerSequence = this._rankPerSequenceMap.get(sequence);
    if (rankPerSequence === null) {
      this._rankPerSequenceMap.set(sequence, rank);
    }
  }

  public hasReceivedSequence(sequence: number): boolean {
    return !!this._rankPerSequenceMap.get(sequence);
  }

  public getAverageRanking() {
    let total = 0;
    const maxConnections = ConfigurationMap.getDefault().DIRECT_CONNECTIONS_MAX;
    const entries = this._rankPerSequenceMap.entries();
    let entry = entries.next();
    while (!entry.done) {
      const [key, rank] = entry.value;
      if (rank) {
        total += (maxConnections - rank + 1) / maxConnections;
      }
      entry = entries.next();
    }
    return Math.pow(((total / this._rankPerSequenceMap.size) || 0.1), 2);
  }
}
