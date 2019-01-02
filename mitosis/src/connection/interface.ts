import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {Protocol} from '../message/interface';
import {Message} from '../message/message';

export interface IConnectionConstructor {
  new(address: Address, options?: IConnectionOptions): IConnection;
}

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

export enum ConnectionState {
  OPEN = 'open',
  CONNECTING = 'connecting',
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
