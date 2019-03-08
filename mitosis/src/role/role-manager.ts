import {Subject} from 'rxjs';
import {Configuration, ConfigurationMap} from '../configuration';
import {Logger} from '../logger/logger';
import {IMessage} from '../message/interface';
import {RoleUpdate} from '../message/role-update';
import {ChurnType, IConnection, IRoleChurnEvent, Mitosis, ObservableMap} from '../mitosis';
import {RemotePeer} from '../peer/remote-peer';
import {IRole, RolePriorityMap, RoleType} from './interface';
import {RoleTypeMap} from './role-map';

export class RoleManager {

  private readonly _myId: string;
  private readonly _roles: ObservableMap<RoleType, IRole>;
  private readonly _roleChurnSubject: Subject<IRoleChurnEvent>;

  public constructor(myId: string, roles: Array<RoleType>) {
    this._myId = myId;
    this._roles = new ObservableMap();
    this._roleChurnSubject = new Subject();
    roles.forEach((r) => this.addRole(r));
  }

  public static getConfigurationForRoles(roles: Array<RoleType>): Configuration {
    return roles
      .map(roleType => {
        return {
          priority: RolePriorityMap.get(roleType),
          config: ConfigurationMap.get(roleType)
        };
      })
      .reduce(
        (previous, current) => previous.priority < current.priority ? current : previous,
        {priority: 0, config: ConfigurationMap.getDefault()}
      ).config;
  }

  public addRole(roleType: RoleType): void {
    if (!this._roles.has(roleType)) {
      const roleClass = RoleTypeMap.get(roleType);
      const role: IRole = new roleClass();
      this._roles.set(roleType, role);
      this._roleChurnSubject.next({type: ChurnType.ADDED, role: roleType});
      Logger.getLogger(this._myId).info(`added role ${roleType}`, this.getRoles());
    }
  }

  public removeRole(roleType: RoleType): void {
    this._roles.delete(roleType);
    this._roleChurnSubject.next({type: ChurnType.REMOVED, role: roleType});
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
    this._roles
      .entriesAsList()
      .map(
        entry =>
          entry[1]
            .getTaskSchedule()
            .map(
              schedule =>
                Object.assign({type: entry[0], role: entry[1]}, schedule)
            )
      )
      .reduce(
        (previous, current) => previous.concat(current), []
      )
      .filter(
        schedule => mitosis.getClock().getTick() % schedule.interval === 0
      )
      .sort(
        schedule => {
          const rolePriority = RolePriorityMap.get(schedule.type);
          const phasePriority = schedule.phase;
          return phasePriority * 100 + rolePriority;
        }
      )
      .reverse()
      .forEach(
        schedule => schedule.task(mitosis)
      );
  }

  public onMessage(mitosis: Mitosis, message: IMessage): void {
    this._roles.forEach(role => role.onMessage(mitosis, message));
  }

  public onConnectionOpen(mitosis: Mitosis, connection: IConnection): void {
    this._roles.forEach(role => role.onConnectionOpen(mitosis, connection));
  }

  public onConnectionClose(mitosis: Mitosis, connection: IConnection): void {
    this._roles.forEach(role => role.onConnectionClose(mitosis, connection));
  }

  public getConfiguration(): Configuration {
    return RoleManager.getConfigurationForRoles(Array.from(this._roles.keys()));
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

  public getRole(roleType: RoleType): IRole {
    return this._roles.get(roleType);
  }

  public observeRoleChurn(): Subject<IRoleChurnEvent> {
    return this._roleChurnSubject;
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
    this._roleChurnSubject.complete();
  }
}
