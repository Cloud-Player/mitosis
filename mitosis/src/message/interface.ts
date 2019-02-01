import {RoleType} from '../role/interface';

export enum MessageSubject {
  INTRODUCTION = 'introduction',
  PEER_UPDATE = 'peer-update',
  ROLE_UPDATE = 'role-update',
  CONNECTION_NEGOTIATION = 'connection-negotiation',
  APP_CONTENT = 'app-content',
  PING = 'ping',
  PONG = 'pong'
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
}
