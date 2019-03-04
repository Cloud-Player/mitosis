export class NodeModel {
  private _selected: boolean;
  private _id: string;
  public x: number;
  public y: number;

  constructor(id: string) {
    this._id = id;
  }

  public getId(): string {
    return this._id;
  }

  public isSelected(): boolean {
    return this._selected;
  }

  public setSelected(isSelected: boolean): void {
    this._selected = isSelected;
  }

  public toJSON() {
    return {
      x: this.x,
      y: this.y
    };
  }

  public textColorTransformer(): string {
    return 'black';
  }

  public textFontWeightTransformer(): string {
    return 'regular';
  }

  public ellipseFillTransformer(): string {
    return 'rgb(211,217,230)';
  }

  public ellipseStrokeColorTransformer(): string {
    return 'rgb(250,252,253)';
  }

  public ellipseStrokeColorSelectedTransformer(): string {
    return 'rgb(9,77,120)';
  }

  public ellipseStrokeWidthTransformer(): string {
    return '2';
  }
}
