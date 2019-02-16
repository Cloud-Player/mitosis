import {IConnection} from '../connection/interface';
import {IMessage} from '../message/interface';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';

export abstract class AbstractRole {

  private _initialized = false;

  protected onTick(mitosis: Mitosis): void {
  }

  public onConnectionClose(mitosis: Mitosis, connection: IConnection): void {
  }

  public onConnectionOpen(mitosis: Mitosis, connection: IConnection): void {
  }

  public onMessage(mitosis: Mitosis, message: IMessage): void {
  }

  public onInit(mitosis: Mitosis): void {
  }

  public doTick(mitosis: Mitosis): void {
    if (!this._initialized) {
      this.onInit(mitosis);
      this._initialized = true;
    }
    this.onTick(mitosis);
  }

  public requiresPeer(remotePeer: RemotePeer): boolean {
    return false;
  }
}
