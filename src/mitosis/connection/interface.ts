import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {Protocol} from '../message/interface';
import {Message} from '../message/message';
import {WebRTCConnection} from './webrtc';
import {WebSocketConnection} from './websocket';

export interface IConnectionConstructor {
  new(...args: Array<any>): IConnection;
}

export const ConnectionTypeMap: Map<Protocol, IConnectionConstructor> = new Map();
ConnectionTypeMap.set(Protocol.WEBSOCKET, WebSocketConnection);
ConnectionTypeMap.set(Protocol.WEBRTC, WebRTCConnection);

export interface IConnection {

  getQuality(): number;

  getAddress(): Address;

  open(): Promise<IConnection>;

  close(): void;

  send(message: Message): void;

  observe(): Subject<any>;
}
