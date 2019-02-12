import {IMessage, Mitosis} from 'mitosis';
import {MockConnection} from '../connection/mock';
import {Edge} from '../edge/edge';
import {Simulation} from '../simulation';
import {NetworkStats} from '../statistics/network-stats';
import {IStatEv, StatLogEvent} from '../statistics/stat-log-event';
import {LogEvent, NodeEventLogger} from './event-logger';

export class Node {
  private _mitosis: Mitosis;
  private _isSelected: boolean;
  private _networkStats: NetworkStats;
  private _inMessages: NodeEventLogger<IMessage>;
  private _outMessages: NodeEventLogger<IMessage>;
  private _networkInLogger: NodeEventLogger<StatLogEvent>;
  private _networkOutLogger: NodeEventLogger<StatLogEvent>;
  public x: number;
  public y: number;

  constructor(mitosis: Mitosis) {
    this._mitosis = mitosis;
    this._networkStats = new NetworkStats(Simulation.getInstance().getClock());
    this._inMessages = new NodeEventLogger<IMessage>();
    this._outMessages = new NodeEventLogger<IMessage>();
    this._networkInLogger = new NodeEventLogger<StatLogEvent>();
    this._networkOutLogger = new NodeEventLogger<StatLogEvent>();
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
    this._networkStats.updateTs(Simulation.getInstance().getClock().getTick());
    this._networkStats.addInComingMessage(message);
    this._inMessages.add(
      new LogEvent<IMessage>(
        Simulation.getInstance().getClock().getTick(),
        message
      )
    );
    this._networkInLogger.addOrUpdateExisting(
      new LogEvent(
        Simulation.getInstance().getClock().getTick(),
        new StatLogEvent(
          {
            amount: this._networkStats.getIncomingStat().getMessageCountForTs(),
            size: this._networkStats.getIncomingStat().getMessageSizeForTs()
          }
        )
      )
    );
  }

  public onSendMessage(message: IMessage) {
    this._networkStats.updateTs(Simulation.getInstance().getClock().getTick());
    this._networkStats.addOutGoingMessage(message);
    this._outMessages.add(
      new LogEvent<IMessage>(
        Simulation.getInstance().getClock().getTick(),
        message
      )
    );
    this._networkOutLogger.addOrUpdateExisting(
      new LogEvent(
        Simulation.getInstance().getClock().getTick(),
        new StatLogEvent(
          {
            amount: this._networkStats.getOutgoingStat().getMessageCountForTs(),
            size: this._networkStats.getOutgoingStat().getMessageSizeForTs()
          }
        )
      )
    );
  }

  public getInbox(): NodeEventLogger<IMessage> {
    return this._inMessages;
  }

  public getOutbox(): NodeEventLogger<IMessage> {
    return this._outMessages;
  }

  public getNetworkInLogger(): NodeEventLogger<StatLogEvent> {
    return this._networkInLogger;
  }

  public getNetworkOutLogger(): NodeEventLogger<StatLogEvent> {
    return this._networkOutLogger;
  }

  public getNetworkStats(): {in: IStatEv, out: IStatEv} {
    return {
      in: this._networkStats.getIncomingStat().getStat(),
      out: this._networkStats.getOutgoingStat().getStat()
    };
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
