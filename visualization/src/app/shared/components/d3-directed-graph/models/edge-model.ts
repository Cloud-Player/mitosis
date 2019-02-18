export class EdgeModel {
  private _sourceId: string;
  private _targetId: string;
  public source: { x: number, y: number } | string;
  public target: { x: number, y: number } | string;

  constructor(source: string, target: string) {
    this.source = source;
    this.target = target;
    this._sourceId = source;
    this._targetId = target;
  }

  public getId() {
    return `${this._sourceId}-${this._targetId}`;
  }

  public equals(otherEdge: EdgeModel): boolean {
    return this.getId() === otherEdge.getId();
  }

  public getSourceId() {
    return this._sourceId;
  }

  public getTargetId() {
    return this.getTargetId();
  }

  public strokeColorTransformer(): string {
    return 'rgba(84,111,125,0.45)';
  }

  public strokeColorSelectedTransformer(): string {
    return 'rgb(2,19,29)';
  }

  public strokeDashArrayTransformer(): Array<number> {
    return [0];
  }
}
