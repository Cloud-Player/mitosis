export class Table<V, T extends Table<V, T>> implements Iterable<V> {

  protected readonly _values: Array<V>;

  public constructor(values: Array<V> = []) {
    this._values = values.slice();
  }

  public get length(): number {
    return this._values.length;
  }

  public static fromIterable<V, T extends Table<V, T>>(iterable: IterableIterator<V>): T {
    return new this(Array.from(iterable)) as T;
  }

  public fromArray(array: Array<V>): T {
    return new (this.constructor as (new (values: Array<V>) => T))(array) as T;
  }

  public asArray(): Array<V> {
    return this._values.slice();
  }

  public has(callbackfn: (value: V) => boolean): boolean {
    return this.count(callbackfn) > 0;
  }

  public count(callbackfn: (value: V) => boolean): number {
    return this.filter(callbackfn).length;
  }

  public filter(callbackfn: (value: V) => boolean): T {
    return this.fromArray(
      this._values.filter(callbackfn)
    );
  }

  public find(callbackfn: (value: V) => boolean): V {
    return this._values.find(callbackfn);
  }

  public exclude(callbackfn: (table: T) => T): T {
    const excluded = callbackfn(this.fromArray(this._values))._values;
    return this.filter(value => excluded.indexOf(value) === -1);
  }

  public sortBy(callbackfn: (value: V) => any): T {
    return this.fromArray(
      this._values.sort(
        (a, b) => {
          const aValue = callbackfn(a);
          const bValue = callbackfn(b);
          if (aValue > bValue) {
            return 1;
          } else if (aValue < bValue) {
            return -1;
          } else {
            return 0;
          }
        }
      )
    );
  }

  public forEach(callbackfn: (value: V, index: number, table: T) => void): T {
    this._values.forEach(
      (arrayValue, arrayIndex, array) =>
        callbackfn(arrayValue, arrayIndex, this.fromArray(array))
    );
    return this.fromArray(this._values);
  }

  public map(callbackfn: (value: V, index: number, table: T) => any): Array<any> {
    return this._values.map(
      (arrayValue, arrayIndex, array) =>
        callbackfn(arrayValue, arrayIndex, this.fromArray(array))
    );
  }

  public slice(start?: number, end?: number): T {
    return this.fromArray(this._values.slice(start, end));
  }

  public [Symbol.iterator](): Iterator<V> {
    return this._values[Symbol.iterator]();
  }

  public concat(table: T): T {
    const values = this._values.concat(table._values);
    return new (this.constructor as (new (values: Array<V>) => T))(values) as T;
  }

  public push(...items: Array<V>): number {
    return this._values.push(...items);
  }

  public shift(): V {
    return this._values.shift();
  }

  public pop(): V {
    return this._values.pop();
  }

  public toString(): string {
    return JSON.stringify(
      this._values,
      undefined,
      2
    );
  }
}
