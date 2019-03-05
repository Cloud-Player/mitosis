export class EdgeModel {
  public source: { x: number, y: number } | string;
  public target: { x: number, y: number } | string;
  private _sourceId: string;
  private _targetId: string;
  private _offset: number;
  private _location: string;
  private _protocol: string;

  constructor(source: string, target: string, location: string = '', offset = 0, protocol: string = '') {
    this.source = source;
    this.target = target;
    this._sourceId = source;
    this._targetId = target;
    this._location = location;
    this._offset = offset;
    this._protocol = protocol;
  }

  public static buildId(prefix, source, target): string {
    return `${prefix}${source}-${target}`;
  }

  public getId() {
    return EdgeModel.buildId(this.getConnectionPrefix(), this._sourceId, this._targetId);
  }

  public getLocation() {
    return this._location;
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

  public getProtocol() {
    return this._protocol;
  }

  public matches(prefix: string, source: string, target: string, location: string = '') {
    return this.getId() === EdgeModel.buildId(prefix, source, target) && this._location === location;
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

  public showOutgoingArrowTransformer(): boolean {
    return false;
  }

  public showIncomingArrowTransformer(): boolean {
    return false;
  }
}
