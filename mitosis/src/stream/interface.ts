import {ChurnType} from '../interface';

export interface IStreamChurnEvent {
  type: ChurnType;
  stream: MediaStream;
  channelId: string;
}
