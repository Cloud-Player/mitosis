import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {Newbie} from './newbie';
import {Peer} from './peer';
import {Router} from './router';
import {Signal} from './signal';

export enum RoleType {
  NEWBIE = 'newbie',
  PEER = 'peer',
  ROUTER = 'router',
  SIGNAL = 'signal'
}

export type IRoleConstructor = new(...args: Array<any>) => IRole;

export const RoleTypeMap: Map<RoleType, IRoleConstructor> = new Map();
RoleTypeMap.set(RoleType.PEER, Peer);
RoleTypeMap.set(RoleType.NEWBIE, Newbie);
RoleTypeMap.set(RoleType.ROUTER, Router);
RoleTypeMap.set(RoleType.SIGNAL, Signal);

export interface IRole {

  onTick(mitosis: Mitosis): void;

  onMessage(message: Message, mitosis: Mitosis): void;
}
