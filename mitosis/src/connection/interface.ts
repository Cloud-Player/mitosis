import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {Message} from '../message/message';

export type IConnectionConstructor = new(address: Address, options?: IConnectionOptions) => IConnection;

export enum Protocol {
  WEBSOCKET_UNSECURE = 'ws',
  WEBSOCKET = 'wss',
  WEBRTC = 'webrtc',
  WEBRTC_STREAM = 'webrtc-stream',
  VIA = 'via'
}

export interface IConnectionOptions {
  protocol: Protocol;
  mitosisId?: string;
  payload?: any;
}

export interface IViaConnectionOptions extends IConnectionOptions {
  protocol: Protocol.VIA;
  payload?: IViaConnectionOptionsPayload;
}

export interface IViaConnectionOptionsPayload {
  quality: number;
}

export interface IWebRTCConnectionOptions extends IConnectionOptions {
  protocol: Protocol.WEBRTC;
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

export enum ConnectionState {
  OPENING = 'opening',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  ERROR = 'error'
}

export interface IConnection {
  getQuality(): number;

  getAddress(): Address;

  open(): Promise<IConnection>;

  close(): void;

  send(message: Message): void;

  observeMessageReceived(): Subject<Message>;

  observeStateChange(): Subject<ConnectionState>;

  getState(): ConnectionState;
}
