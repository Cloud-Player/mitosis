export class EdgeModel {
  private _sourceId: string;
  private _targetId: string;
  private _offset: number;
  private _id: string;
  public source: { x: number, y: number } | string;
  public target: { x: number, y: number } | string;

  constructor(source: string, target: string, offset = 0) {
    this.source = source;
    this.target = target;
    this._sourceId = source;
    this._targetId = target;
    this._offset = offset;
  }

  public static buildId(prefix, source, target): string {
    return `${prefix}${source}-${target}`;
  }

  public getId() {
    return EdgeModel.buildId(this.getConnectionPrefix(), this._sourceId, this._targetId);
  }

  public getConnectionPrefix() {
    return 'c';
  }

  public getSourceId() {
    return this._sourceId;
  }

  public getTargetId() {
    return this._targetId;
  }

  public getOffset() {
    return this._offset;
  }

  public matches(prefix: string, source: string, target: string) {
    return this.getId() === EdgeModel.buildId(prefix, source, target);
  }

  public strokeColorTransformer(): string {
    return 'rgb(84,111,125)';
  }

  public strokeColorSelectedTransformer(): string {
    return 'rgb(2,19,29)';
  }

  public strokeDashArrayTransformer(): Array<number> {
    return [0];
  }
}
