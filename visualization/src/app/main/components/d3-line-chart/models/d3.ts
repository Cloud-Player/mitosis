export interface IValue {
  x: number;
  y: number;
}

export class D3Model {
  private _values: Array<IValue>;
  private _events: { [key: string]: Array<() => void> };

  constructor() {
    this._values = [];
    this._events = {};
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

  public getMaxY() {
    return this._values
      .map(value => value.y)
      .reduce(
        (previous, current) => current > previous ? current : previous,
        0
      );
  }

  public getMinY() {
    return this._values
      .map(value => value.y)
      .reduce(
        (previous, current) => current < previous ? current : previous,
        0
      );
  }

  public getValues(): Array<IValue> {
    return this._values;
  }
}
