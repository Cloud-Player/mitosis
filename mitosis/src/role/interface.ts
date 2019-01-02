import {Mitosis} from '../index';
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

export interface IRoleConstructor {
  new(...args: Array<any>): IRole;
}

export const RoleTypeMap: Map<RoleType, IRoleConstructor> = new Map();
RoleTypeMap.set(RoleType.PEER, Peer);
RoleTypeMap.set(RoleType.NEWBIE, Newbie);
RoleTypeMap.set(RoleType.ROUTER, Router);
RoleTypeMap.set(RoleType.SIGNAL, Signal);

export interface IRole {

  onTick(mitosis: Mitosis): void;
}
