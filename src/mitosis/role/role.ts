import {RoutingTable} from '../mesh/routing-table';

export abstract class AbstractRole {

  protected _routingTable: RoutingTable;
  private _isInitialised = false;

  public onTick(): void {
    if (this._isInitialised) {
      this._onTick();
    }
  }

  public initialise(routingTable: RoutingTable): void {
    this._routingTable = routingTable;
    this._initialise().then(() => this._isInitialised = true);
  }

  protected abstract _initialise(): Promise<void>;

  protected abstract _onTick(): void;
}
