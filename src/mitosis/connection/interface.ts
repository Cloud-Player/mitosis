import {WebRTCConnection} from './webrtc-connection';
import {WSConnection} from './ws-connection';

export enum ConnectionType {
  WEBSOCKET = 'wss',
  WEBRTC = 'webrtc'
}

export interface IConnectionConstructor {
  new(...args: Array<any>): IConnection;
}

export const ConnectionTypeMap: Map<ConnectionType, IConnectionConstructor> = new Map([
  [ConnectionType.WEBSOCKET, WSConnection],
  [ConnectionType.WEBRTC, WebRTCConnection]
]);

export interface IConnection {

  getQuality(): number;

  getPeerId(): number;

  open(): Promise<IConnection>;

  close(): Promise<void>;

  send(data: any): void;
}
