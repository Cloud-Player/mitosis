export class DefaultMap<K, V> extends Map<K, V> {

  private readonly _factory: () => V;
  private readonly _default: V;

  public constructor(factory: () => V) {
    super();
    this._factory = factory;
    this._default = factory();
  }

  public get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this._factory());
    }
    return super.get(key);
  }

  public getDefault(): V {
    return this._default;
  }
}
