import {ChurnType} from '../interface';
import {RemotePeer} from './remote-peer';

export interface IPeerChurnEvent {
  type: ChurnType;
  peer: RemotePeer;
}
