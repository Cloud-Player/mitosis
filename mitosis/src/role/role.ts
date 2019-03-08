import {IConnection} from '../connection/interface';
import {IMessage} from '../message/interface';
import {ITaskSchedule, Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';

export abstract class AbstractRole {

  private _initialized: boolean;

  public constructor() {
    this._initialized = false;
  }

  public abstract getTaskSchedule(): Array<ITaskSchedule>;

  public isInitialized(): boolean {
    return this._initialized;
  }

  public onInit(mitosis: Mitosis): void {
  }

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
