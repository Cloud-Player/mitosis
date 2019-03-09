import {Configuration} from '../configuration';
import {RoleType} from '../role/interface';
import {DefaultMap} from '../util/default-map';
import {Address} from './address';

export enum MessageSubject {
  INTRODUCTION = 'introduction',
  PEER_UPDATE = 'peer-update',
  PEER_SUGGESTION = 'peer-suggestion',
  ROLE_UPDATE = 'role-update',
  CONNECTION_NEGOTIATION = 'connection-negotiation',
  CHANNEL_ANNOUNCEMENT = 'channel-announcement',
  APP_CONTENT = 'app-content',
  UNKNOWN_PEER = 'unknown-peer',
  PING = 'ping',
  PONG = 'pong',
  ROUTER_ALIVE = 'router-alive',
  PEER_ALIVE = 'peer-alive'
}

export const MessageTtls: DefaultMap<MessageSubject, number> = new DefaultMap(() => 1);
MessageTtls.set(MessageSubject.PEER_UPDATE, 1);
MessageTtls.set(MessageSubject.PEER_SUGGESTION, 10);
MessageTtls.set(MessageSubject.APP_CONTENT, 16);
MessageTtls.set(MessageSubject.CONNECTION_NEGOTIATION, 20);
MessageTtls.set(MessageSubject.ROUTER_ALIVE, 20);
MessageTtls.set(MessageSubject.PEER_ALIVE, 20);

export interface IPeerUpdateEntry {
  peerId: string;
  roles: Array<RoleType>;
  quality: number;
}

export interface IChannelProvider {
  peerId: string;
  capacity: number;
}

export interface IChannelAnnouncement {
  providers: Array<IChannelProvider>;
  channelId: string;
}

export interface IMessage {

  length: number;

  getReceiver(): Address;

  getSender(): Address;

  getInboundAddress(): Address;

  getSubject(): MessageSubject;

  getBody(): any;

  getId(): string;

  getTtl(): number;

  decreaseTtl(): number;

  setInboundAddress(address: Address): void;
}

export interface IFloodableMessage extends IMessage {
  getBody(): {
    sequence: number;
    [key: string]: any;
  };
}
