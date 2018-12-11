import {Peer} from '../mesh/peer';
import {IRole} from './interface';
import {RoleType} from './type';

export class Router implements IRole {

  public readonly type = RoleType.ROUTER;
  private parent: Peer;
  private succession: Array<Peer>;

  public onTick(): void {
  }

  public advertise(): void {
  }

  public introduce(offer: any): void {
  }
}
