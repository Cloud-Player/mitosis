import {Mitosis} from '../mitosis';
import {IRole, RoleType, RoleTypeMap} from '../role/interface';
import {Message} from '../message/message';

export class RoleManager {
  private _roles: Map<RoleType, IRole>;

  public constructor(roles: Array<RoleType>) {
    this._roles = new Map();
    roles.forEach((r) => this.addRole(r));
  }

  private addRole(roleType: RoleType): void {
    if (!this._roles.has(roleType)) {
      const roleClass = RoleTypeMap.get(roleType);
      const role: IRole = new roleClass();
      this._roles.set(roleType, role);
    }
  }

  private removeRole(roleType: RoleType): void {
    this._roles.delete(roleType);
  }

  public updateRoles(roleTypes: Array<RoleType>): void {

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

  public onMessage(message: Message, mitosis: Mitosis): void {
    this._roles.forEach(role => role.onMessage(message, mitosis));
  }
}
