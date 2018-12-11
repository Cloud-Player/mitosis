import {RoutingTable} from '../mesh/routing-table';

export abstract class AbstractRole {

  protected _routingTable: RoutingTable;
  private _isInitialised = false;

  public constructor() {
    this._initialise().then(() => this._isInitialised = true);
  }

  public onTick(): void {
    if (this._isInitialised) {
      this._onTick();
    }
  }

  public setRoutingTable(routingTable: RoutingTable): void {
    this._routingTable = routingTable;
  }

  protected abstract _initialise(): Promise<void>;

  protected abstract _onTick(): void;
}
