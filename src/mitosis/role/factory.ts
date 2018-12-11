import {RoutingTable} from '../mesh/routing-table';
import {IRole, RoleType, RoleTypeMap} from './interface';

export class RoleFactory {

  private _routingTable: RoutingTable;

  constructor(routingTable: RoutingTable) {
    this._routingTable = routingTable;
  }

  public create(roleType: RoleType): IRole {
    const roleClass = RoleTypeMap.get(roleType);
    const role: IRole = new roleClass();
    role.setRoutingTable(this._routingTable);
    return role;
  }
}
