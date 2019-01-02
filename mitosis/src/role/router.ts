import {Mitosis} from '../index';
import {RemotePeer} from '../mesh/remote-peer';
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
}
