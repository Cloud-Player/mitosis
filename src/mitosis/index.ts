import {InternalClock} from './clock/internal';
import {SecureEnclave} from './enclave/secure';
import {Peer} from './mesh/peer';
import {IRole} from './role/interface';
import {RoleType} from './role/type';

export class Mitosis implements IRole {

  public readonly type = RoleType.PEER;
  private _enclave: IEnclave;
  private _roles: { [type in RoleType]: IRole };
  private _peers: Array<Peer>;

  public constructor(clock: IClock = new InternalClock(), enclave: IEnclave = new SecureEnclave()) {
    this._roles[this.type] = this;
    this._enclave = enclave;
    clock.onTick(() => Object.values(this._roles).forEach(role => role.onTick()));
  }

  public onTick(): void {
  }

  public addRole(role: IRole): void {
    this._roles[role.type] = role;
  }

  public removeRole(type: RoleType): void {
    delete this._roles[type];
  }

  public getPeers(): Array<Peer> {
    return this._peers;
  }
}
