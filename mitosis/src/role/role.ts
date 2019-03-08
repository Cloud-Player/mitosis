import {IConnection} from '../connection/interface';
import {IMessage} from '../message/interface';
import {ITaskSchedule, Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';

export abstract class AbstractRole {

  public abstract getTaskSchedule(): Array<ITaskSchedule>;

  public onConnectionClose(mitosis: Mitosis, connection: IConnection): void {
  }

  public onConnectionOpen(mitosis: Mitosis, connection: IConnection): void {
  }

  public onMessage(mitosis: Mitosis, message: IMessage): void {
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return false;
  }
}
