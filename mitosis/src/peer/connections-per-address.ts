import {Subject} from 'rxjs';
import {IConnection} from '../connection/interface';

export enum ConnectionsPerAddressEventType {
  ADD = 'add',
  REMOVE = 'remove',
  RESET = 'reset'
}

export interface IConnectionsPerAddressEvent<EntityType> {
  type: ConnectionsPerAddressEventType;
  entity: EntityType;
}

export class ConnectionsPerAddress extends Map<string, IConnection> {
  private _subject: Subject<IConnectionsPerAddressEvent<IConnection>>;

  constructor(entries?: ReadonlyArray<[string, IConnection]> | null) {
    super(entries);
    this._subject = new Subject();
  }

  clear(): void {
    super.clear();
    this._subject.next({
      type: ConnectionsPerAddressEventType.RESET,
      entity: null
    });
  }

  delete(key: string): boolean {
    const entity = this.get(key);
    const couldDelete = super.delete(key);
    if (couldDelete) {
      this._subject.next({
        type: ConnectionsPerAddressEventType.REMOVE,
        entity: entity
      });
    }
    return couldDelete;
  }

  set(key: string, value: IConnection): this {
    const couldSet = super.set(key, value);
    if (couldSet) {
      this._subject.next({
        type: ConnectionsPerAddressEventType.ADD,
        entity: value
      });
    }
    return couldSet;
  }

  public observe() {
    return this._subject;
  }
}
