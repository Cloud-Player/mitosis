export interface IValue {
  x: number;
  y: number;
}

export class D3Model {
  private _id: string;
  private _values: Array<IValue>;
  private _events: { [key: string]: Array<() => void> };
  private _color: string;
  private _label: string;

  constructor(id, color, label) {
    this._values = [];
    this._events = {};
    this._id = id;
    this._color = color;
    this._label = label;
  }

  private triggerEv(key) {
    if (this._events[key]) {
      this._events[key].forEach((fn) => {
        fn();
      });
    }
  }

  private trigger(keys: Array<string>) {
    keys.forEach(key => this.triggerEv(key));
  }

  private onKey(key: string, callback: () => void) {
    if (this._events[key]) {
      this._events[key].push(callback);
    } else {
      this._events[key] = [callback];
    }
  }

  public on(key: string, callback: () => void) {
    const keys = key.split(' ');
    keys.forEach(evKey => this.onKey(evKey, callback));
  }

  public add(x: number, y: number) {
    this._values.push({x: x, y: y});
    this.trigger(['add']);
  }

  public getValues(): Array<IValue> {
    return this._values;
  }

  public getId() {
    return this._id;
  }

  public getColor() {
    return this._color;
  }
}
