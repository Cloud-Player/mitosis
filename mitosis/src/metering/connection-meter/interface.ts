import {Subject} from 'rxjs';
import {IConnection} from '../../connection/interface';
import {IMeter} from '../interface';

export enum IConnectionEventType {
  PUNISHED = 'punished',
  PROTECTED = 'protected',
  UNPUNISHED = 'unpunished',
  UNPROTECTED = 'unprotected'
}

export interface IConnectionMeterEvent {
  type: IConnectionEventType;
  connection: IConnection;
}

export interface IConnectionMeter extends IMeter {

  isProtected(): boolean;

  isPunished(): boolean;

  getLastSeen(): number;

  isLastSeenExpired(): boolean;

  observe(): Subject<IConnectionMeterEvent>;

  toString(): string;

  toJSON(): { [key: string]: any };
}
