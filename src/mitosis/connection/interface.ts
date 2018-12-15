import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {Protocol} from '../message/interface';
import {Message} from '../message/message';
import {ConnectionState} from './connection';
import {WebRTCConnection} from './webrtc';
import {WebSocketConnection} from './websocket';

export interface IConnectionConstructor {
  new(address: Address, options?: IConnectionOptions): IConnection;
}

export const ConnectionTypeMap: Map<Protocol, IConnectionConstructor> = new Map();
ConnectionTypeMap.set(Protocol.WEBSOCKET, WebSocketConnection);
ConnectionTypeMap.set(Protocol.WEBRTC, WebRTCConnection);

export interface IConnectionOptions {
  protocol: Protocol;
  payload?: any;
}

export interface IWebRTCConnectionOptions extends IConnectionOptions {
  protocol: Protocol.WEBRTC;
  mitosisId: string;
  payload?: IWebRTCConnectionOptionsPayload;
}

export enum WebRTCConnectionOptionsPayloadType {
  OFFER = 'offer',
  ANSWER = 'answer'
}

export interface IWebRTCConnectionOptionsPayload {
  type: WebRTCConnectionOptionsPayloadType;
  sdp: string;
}

export interface IConnection {

  getQuality(): number;

  getAddress(): Address;

  open(): Promise<IConnection>;

  close(): void;

  send(message: Message): void;

  observeMessageReceived(): Subject<Message>;

  observeStateChange(): Subject<ConnectionState>;

  isOpen(): boolean;
}
