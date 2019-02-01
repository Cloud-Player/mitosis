import {Subject} from 'rxjs';
import {IMeter} from '../interface';
import {IConnection} from '../../connection/interface';

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

  observe(): Subject<IConnectionMeterEvent>;
}
