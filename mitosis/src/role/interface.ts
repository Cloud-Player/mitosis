import {IMessage} from '../message/interface';
import {IConnection, Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';

export enum RoleType {
  NEWBIE = 'newbie',
  PEER = 'peer',
  ROUTER = 'router',
  SIGNAL = 'signal',
  STREAMER = 'streamer'
}

export const RolePriorityMap: Map<RoleType, number> = new Map();
RolePriorityMap.set(RoleType.NEWBIE, 10);
RolePriorityMap.set(RoleType.PEER, 20);
RolePriorityMap.set(RoleType.STREAMER, 30);
RolePriorityMap.set(RoleType.ROUTER, 40);
RolePriorityMap.set(RoleType.SIGNAL, 50);

export type IRoleConstructor = new(...args: Array<any>) => IRole;

export interface IRole {

  onTick(mitosis: Mitosis): void;

  onMessage(mitosis: Mitosis, message: IMessage): void;

  onConnectionOpen(mitosis: Mitosis, connection: IConnection): void;

  onConnectionClose(mitosis: Mitosis, connection: IConnection): void;

  requiresPeer(remotePeer: RemotePeer): boolean;
}
