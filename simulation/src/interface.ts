import {IMessage, RoleType} from 'mitosis';

export interface INodeMessageLog {
  message: IMessage;
  nodeId: string;
  inComing: boolean;
}

export interface IMitosisSettings {
  peerAddress?: string;
  signalAddress?: string;
  roles?: Array<RoleType>;
}

export interface IConnectionSettings {
  stability: number;
  latency: number;
  establishDelay: number;
}
