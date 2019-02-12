export class DefaultMap<K, V> extends Map<K, V> {

  private readonly _default: V;

  public constructor(value: V) {
    super();
    this._default = value;
  }

  public get(key: K): V {
    return super.get(key) || this._default;
  }

  public getDefault(): V {
    return this._default;
  }
}
