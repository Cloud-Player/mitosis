import {Mitosis} from '../mitosis';
import {IMessage} from '../message/interface';
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

  onMessage(mitosis: Mitosis, message: IMessage): void;

  requiresPeer(remotePeer: RemotePeer): boolean;
}
