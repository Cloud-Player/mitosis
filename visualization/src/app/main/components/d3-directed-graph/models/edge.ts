export class EdgeModel {
  private _source: string;
  private _target: string;
  private _connectionAmount = 1;

  constructor(source: string, target: string) {
    this._source = source;
    this._target = target;
  }

  public getSource(): string {
    return this._source;
  }

  public getTarget(): string {
    return this._target;
  }

  public increaseConnectionAmount(): number {
    this._connectionAmount++;
    return this._connectionAmount;
  }

  public getConnectionAmount(): number {
    return this._connectionAmount;
  }
}
