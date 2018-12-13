import {InternalClock} from './clock/internal';
import {SecureEnclave} from './enclave/secure';
import {RemotePeer} from './mesh/remote-peer';
import {RoutingTable} from './mesh/routing-table';
import {RoleFactory} from './role/factory';
import {IRole, RoleType} from './role/interface';

export class Mitosis {

  private _enclave: IEnclave;
  private _roles: Map<RoleType, IRole>;
  private _roleFactory: RoleFactory;
  private _routingTable: RoutingTable;
  private _myId: string;

  public constructor(
    clock: IClock = new InternalClock(),
    enclave: IEnclave = new SecureEnclave(),
    roles: Array<RoleType> = [RoleType.NEWBIE]
  ) {
    this._myId = Math.round(Math.random() * 1000000000000).toString();
    this._routingTable = new RoutingTable(this._myId);
    this._roleFactory = new RoleFactory(this._routingTable);
    this._roles = new Map();
    roles.forEach((r) => this.addRole(r));
    this._enclave = enclave;
    clock.onTick(this.onTick.bind(this));
  }

  public addRole(roleType: RoleType): void {
    if (!this._roles.has(roleType)) {
      this._roles.set(roleType, this._roleFactory.create(roleType));
    }
  }

  public removeRole(roleType: RoleType): void {
    this._roles.delete(roleType);
  }

  public getPeers(): Array<RemotePeer> {
    return this._routingTable.getPeers();
  }

  private onTick(): void {
    this._roles.forEach(role => role.onTick());
  }
}
