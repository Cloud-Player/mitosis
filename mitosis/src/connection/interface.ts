import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {ChurnType} from '../interface';
import {Address} from '../message/address';
import {IMessage} from '../message/interface';
import {IMeter} from '../metering/interface';

export type IConnectionConstructor = new (
  address: Address,
  clock: IClock,
  options?: IConnectionOptions
) => IConnection;

export enum Protocol {
  WEBSOCKET_UNSECURE = 'ws',
  WEBSOCKET = 'wss',
  WEBRTC_DATA = 'webrtc-data',
  WEBRTC_STREAM = 'webrtc-stream',
  VIA = 'via',
  VIA_MULTI = 'via-multi'
}

export interface IConnectionChurnEvent {
  type: ChurnType;
  connection: IConnection;
}

export interface IConnectionOptions {
  mitosisId?: string;
  payload?: any;
}

export interface IViaConnectionOptions extends IConnectionOptions {
  payload: IViaConnectionOptionsPayload;
}

export interface IViaConnectionOptionsPayload {
  parent: IConnection;
}

export interface IWebRTCConnectionOptions extends IConnectionOptions {
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

  getMeter(): IMeter;

  getAddress(): Address;

  open(): Promise<IConnection>;

  close(): void;

  send(message: IMessage): void;

  observeMessageReceived(): Subject<IMessage>;

  observeStateChange(): Subject<ConnectionState>;

  getState(): ConnectionState;

  isInState(...states: Array<ConnectionState>): boolean;
}
