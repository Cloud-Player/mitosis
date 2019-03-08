import {IMessage} from '../message/interface';
import {ChurnType, IConnection, Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';

export enum RoleType {
  NEWBIE = 'newbie',
  PEER = 'peer',
  ROUTER = 'router',
  SIGNAL = 'signal'
}

export enum TaskPhase {
  CLEAN = 30,
  ACQUIRE = 20,
  PUBLISH = 10
}

export const RolePriorityMap: Map<RoleType, number> = new Map();
RolePriorityMap.set(RoleType.NEWBIE, 10);
RolePriorityMap.set(RoleType.PEER, 20);
RolePriorityMap.set(RoleType.ROUTER, 30);
RolePriorityMap.set(RoleType.SIGNAL, 40);

export type IRoleConstructor = new(...args: Array<any>) => IRole;

export interface ITaskSchedule {
  task: (mitosis: Mitosis) => void;
  phase: TaskPhase;
  interval: number;
}

export interface IRole {

  getTaskSchedule(): Array<ITaskSchedule>;

  onMessage(mitosis: Mitosis, message: IMessage): void;

  onConnectionOpen(mitosis: Mitosis, connection: IConnection): void;

  onConnectionClose(mitosis: Mitosis, connection: IConnection): void;

  requiresPeer(remotePeer: RemotePeer): boolean;
}

export interface IRoleChurnEvent {
  type: ChurnType;
  role: RoleType;
}
