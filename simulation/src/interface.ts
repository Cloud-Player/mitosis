import {IMessage} from 'mitosis';

export interface INodeMessageLog {
  message: IMessage;
  nodeId: string;
  inComing: boolean;
}
