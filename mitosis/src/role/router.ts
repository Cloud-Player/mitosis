import {RemotePeer} from '../mesh/remote-peer';
import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {IRole} from './interface';

export class Router implements IRole {
  private parent: RemotePeer;
  private succession: Array<RemotePeer>;

  public advertise(): void {
  }

  public introduce(offer: any): void {
  }

  public onTick(mitosis: Mitosis): void {
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }
}
