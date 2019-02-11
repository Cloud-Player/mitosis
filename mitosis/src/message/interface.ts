import {RoleType} from '../role/interface';
import {Address} from './address';

export enum MessageSubject {
  INTRODUCTION = 'introduction',
  PEER_UPDATE = 'peer-update',
  ROLE_UPDATE = 'role-update',
  CONNECTION_NEGOTIATION = 'connection-negotiation',
  APP_CONTENT = 'app-content',
  UNKNOWN_PEER = 'unknown-peer',
  PING = 'ping',
  PONG = 'pong',
  ROUTER_ALIVE = 'router-alive'
}

export interface IPeerUpdateEntry {
  peerId: string;
  roles: Array<RoleType>;
  quality: number;
}

export interface IMessage {
  getReceiver(): Address;

  getSender(): Address;

  getInboundAddress(): Address;

  getSubject(): MessageSubject;

  getBody(): any;

  getId(): string;

  setInboundAddress(address: Address): void;

  length: number;
}

export interface IFloodableMessage extends IMessage {
  getBody(): {
    sequence: number;
    [key: string]: any;
  };
}
