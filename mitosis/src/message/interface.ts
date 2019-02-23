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
  ROUTER_ALIVE = 'router-alive',
  CHANNEL_ANNOUNCEMENT = 'channel-announcement',
  CHANNEL_REQUEST = 'channel-request'
}

export interface IPeerUpdateEntry {
  peerId: string;
  roles: Array<RoleType>;
  quality: number;
}

export interface IChannelAnnouncementBody {
  entries: Array<IChannelAnnouncementEntry>;
  channelId: string;
}

export interface IChannelAnnouncementEntry {
  peerId: string;
  capacity: number;
}

export interface IMessage {

  length: number;

  getReceiver(): Address;

  getSender(): Address;

  getInboundAddress(): Address;

  getSubject(): MessageSubject;

  getBody(): any;

  getId(): string;

  setInboundAddress(address: Address): void;
}

export interface IFloodableMessage extends IMessage {
  getBody(): {
    sequence: number;
    [key: string]: any;
  };
}
