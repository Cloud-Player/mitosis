import {Message} from '../message/message';
import {IMessage, Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';

export enum RoleType {
  NEWBIE = 'newbie',
  PEER = 'peer',
  ROUTER = 'router',
  SIGNAL = 'signal'
}

export type IRoleConstructor = new(...args: Array<any>) => IRole;

export interface IRole {

  onTick(mitosis: Mitosis): void;

  onMessage(message: IMessage, mitosis: Mitosis): void;

  requiresPeer(remotePeer: RemotePeer): boolean;
}
