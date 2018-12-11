import {RemotePeer} from '../mesh/remote-peer';
import {IRole} from './interface';
import {AbstractRole} from './role';

export class Router extends AbstractRole implements IRole {
  private parent: RemotePeer;
  private succession: Array<RemotePeer>;

  public advertise(): void {
  }

  public introduce(offer: any): void {
  }

  protected _onTick(): void {
  }

  protected _initialise(): Promise<void> {
    return undefined;
  }
}
