import {Subject} from 'rxjs';
import {ChurnType} from '../interface';
import {TableView} from './table-view';

export interface IObservableMapEvent<V> {
  type: ChurnType;
  value: V;
}

export class ObservableMap<K, V> extends Map<K, V> {
  private readonly _subject: Subject<IObservableMapEvent<V>>;

  constructor(entries?: ReadonlyArray<[K, V]> | null) {
    super(entries);
    this._subject = new Subject();
  }

  public clear(): void {
    Array.from(this.values())
      .forEach(
        (value: V) =>
          this._subject.next({
            type: ChurnType.REMOVED,
            value: value
          })
      );
    super.clear();
  }

  public delete(key: K): boolean {
    const value = this.get(key);
    const success = super.delete(key);
    if (success) {
      this._subject.next({
        type: ChurnType.REMOVED,
        value: value
      });
    }
    return success;
  }

  public set(key: K, value: V): this {
    const success = super.set(key, value);
    if (success) {
      this._subject.next({
        type: ChurnType.ADDED,
        value: value
      });
    }
    return success;
  }

  public asTable(): TableView<V> {
    return TableView.fromIterable(this.values());
  }

  public keysAsList(): Array<K> {
    return Array.from(this.keys());
  }

  public valuesAsList(): Array<V> {
    return Array.from(this.values());
  }

  public entriesAsList(): Array<[K, V]> {
    return Array.from(this.entries());
  }

  public observe(): Subject<IObservableMapEvent<V>> {
    return this._subject;
  }

  public destroy(): void {
    this._subject.complete();
  }
}
