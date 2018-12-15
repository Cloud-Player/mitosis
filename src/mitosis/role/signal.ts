import {RemotePeer} from '../mesh/remote-peer';
import {IRole} from './interface';
import {AbstractRole} from './role';

export class Signal extends AbstractRole implements IRole {

  public introduce(): RemotePeer {
    return null;
  }

  protected _onTick(): void {
  }

  protected _initialise(): Promise<void> {
    return undefined;
  }
}
