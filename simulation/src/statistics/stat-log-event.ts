export interface IStatEv {
  count: number;
  size: number;
}

export class StatLogEvent {
  private _stat: IStatEv;

  constructor(stat: IStatEv) {
    this._stat = stat;
  }

  public getStat(): IStatEv {
    return this._stat;
  }
}
