import {RoleType} from '../role/interface';

export enum MessageSubject {
  INTRODUCTION = 'introduction',
  PEER_UPDATE = 'peer-update',
  ROLE_UPDATE = 'role-update',
  CONNECTION_NEGOTIATION = 'connection-negotiation',
  APP_CONTENT = 'app-content'
}

export interface IRoutingTableUpdateEntry {
  peerId: string;
  roles: Array<RoleType>;
  quality: number;
}
