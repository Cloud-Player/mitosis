import {IRoleConstructor, RoleType} from './interface';
import {Newbie} from './newbie';
import {Peer} from './peer';
import {Router} from './router';
import {Signal} from './signal';

export const RoleTypeMap: Map<RoleType, IRoleConstructor> = new Map();
RoleTypeMap.set(RoleType.PEER, Peer);
RoleTypeMap.set(RoleType.NEWBIE, Newbie);
RoleTypeMap.set(RoleType.ROUTER, Router);
RoleTypeMap.set(RoleType.SIGNAL, Signal);
