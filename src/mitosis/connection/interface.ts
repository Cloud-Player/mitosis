import {Protocol} from '../address/interface';
import {WebRTCConnection} from './webrtc';
import {WebSocketConnection} from './websocket';

export interface IConnectionConstructor {
  new(...args: Array<any>): IConnection;
}

export const ConnectionTypeMap: Map<Protocol, IConnectionConstructor> = new Map([
  [Protocol.WEBSOCKET, WebSocketConnection],
  [Protocol.WEBRTC, WebRTCConnection]
]);

export interface IConnection {

  getQuality(): number;

  getPeerId(): number;

  open(): Promise<IConnection>;

  close(): Promise<void>;

  send(data: any): void;
}
