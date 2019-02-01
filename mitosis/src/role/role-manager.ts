import {Logger} from '../logger/logger';
import {Message} from '../message/message';
import {RoleUpdate} from '../message/role-update';
import {Mitosis} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RoleType} from './interface';
import {RoleTypeMap} from './role-map';

export class RoleManager {

  private readonly _myId: string;
  private readonly _roles: Map<RoleType, IRole>;

  public constructor(myId: string, roles: Array<RoleType>) {
    this._myId = myId;
    this._roles = new Map();
    roles.forEach((r) => this.addRole(r));
  }

  public addRole(roleType: RoleType): void {
    if (!this._roles.has(roleType)) {
      const roleClass = RoleTypeMap.get(roleType);
      const role: IRole = new roleClass();
      this._roles.set(roleType, role);
      Logger.getLogger(this._myId).info(`added role ${roleType}`, this.getRoles());
    }
  }

  public removeRole(roleType: RoleType): void {
    this._roles.delete(roleType);
    Logger.getLogger(this._myId).info(`removed role ${roleType}`, this.getRoles());
  }

  public updateRoles(roleUpdate: RoleUpdate): void {
    // TODO: Only accept role update from superior
    const roleTypes: Array<RoleType> = roleUpdate.getBody();
    this._roles.forEach((role, roleType) => {
      if (roleTypes.indexOf(roleType) === -1) {
        this.removeRole(roleType);
      }
    });
    roleTypes.forEach(roleType => {
      this.addRole(roleType);
    });
  }

  public onTick(mitosis: Mitosis): void {
    this._roles.forEach(role => role.onTick(mitosis));
  }

  public onMessage(mitosis: Mitosis, message: Message): void {
    this._roles.forEach(role => role.onMessage(mitosis, message));
  }

  public getRolesRequiringPeer(remotePeer: RemotePeer): Array<RoleType> {
    return this.getRoles()
      .filter(
        roleType => this._roles.get(roleType).requiresPeer(remotePeer)
      );
  }

  public getRoles(): Array<RoleType> {
    return Array.from(this._roles.keys());
  }

  public hasRole(...roleTypes: Array<RoleType>): boolean {
    return this.getRoles()
      .filter(roleType => roleTypes.indexOf(roleType) >= 0)
      .length > 0;
  }

  public toString(): string {
    return JSON.stringify({
        count: this._roles.size,
        roleTypes: Array.from(this._roles.keys())
      },
      undefined,
      2
    );
  }

  public destroy(): void {
    this._roles.clear();
  }
}
