import {RemotePeer} from './remote-peer';

export enum ChurnType {
  ADDED = 'added',
  REMOVED = 'removed'
}

export interface IPeerChurnEvent {
  type: ChurnType;
  peer: RemotePeer;
}
