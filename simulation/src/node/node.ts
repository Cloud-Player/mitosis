import {IMessage, Mitosis} from 'mitosis';
import {MockConnection} from '../connection/mock';
import {Edge} from '../edge/edge';
import {NetworkStats} from '../statistics/network-stats';
import {Simulation} from '../simulation';

export class Node {
  private _mitosis: Mitosis;
  private _isSelected: boolean;
  public x: number;
  public y: number;
  public networkStats: NetworkStats;

  constructor(mitosis: Mitosis) {
    this._mitosis = mitosis;
    this.networkStats = new NetworkStats(Simulation.getInstance().getClock());
  }

  public getMitosis() {
    return this._mitosis;
  }

  public getEdges() {
    const edges: Array<Edge> = [];
    this._mitosis
      .getPeerTable()
      .forEach(
        peer => {
          peer
            .getConnectionTable()
            .filterDirect()
            .forEach(
              (connection: MockConnection) => {
                edges.push(new Edge(this.getId(), connection));
              });
        });
    return edges;
  }

  public onReceiveMessage(message: IMessage) {
    this.networkStats.addInComingMessage(message);
  }

  public onSendMessage(message: IMessage) {
    this.networkStats.addOutGoingMessage(message);
  }

  public getId() {
    return this._mitosis.getMyAddress().getId();
  }

  public setSelected(isSelected: boolean) {
    this._isSelected = isSelected;
  }

  public isSelected() {
    return this._isSelected;
  }
}
