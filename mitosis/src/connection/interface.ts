import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {ChurnType} from '../interface';
import {Address} from '../message/address';
import {ConnectionNegotiationType} from '../message/connection-negotiation';
import {IMessage} from '../message/interface';
import {IConnectionMeter} from '../metering/connection-meter/interface';

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
  quality: number;
}

export interface IWebRTCConnectionOptions extends IConnectionOptions {
  payload?: IWebRTCConnectionOptionsPayload;
}

export interface IWebRTCStreamConnectionOptions extends IWebRTCConnectionOptions {
  stream: MediaStream;
  channelId: string;
}

export interface IWebRTCConnectionOptionsPayload {
  type: ConnectionNegotiationType;
  sdp: string;
}

export enum ConnectionState {
  OPENING = 'opening',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  ERROR = 'error'
}

export enum NegotiationState {
  INITIALIZING = 0,
  WAITING_FOR_OFFER = 10,
  WAITING_FOR_ANSWER = 20,
  WAITING_FOR_ESTABLISH = 30,
  ESTABLISHED = 40
}

export interface IConnection {

  getMeter(): IConnectionMeter;

  getAddress(): Address;

  open(): Promise<IConnection>;

  close(): void;

  send(message: IMessage): void;

  observeMessageReceived(): Subject<IMessage>;

  observeStateChange(): Subject<ConnectionState>;

  getState(): ConnectionState;

  getNegotiationState(): NegotiationState;

  isInState(...states: Array<ConnectionState>): boolean;
}
