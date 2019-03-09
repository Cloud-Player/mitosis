import {IMessage, Mitosis} from 'mitosis';
import {MockConnection} from '../connection/mock';
import {Edge} from '../edge/edge';
import {INodeMessageLog} from '../interface';
import {Simulation} from '../simulation';
import {NetworkStats} from '../statistics/network-stats';
import {IStatEv, StatLogEvent} from '../statistics/stat-log-event';
import {LogEvent, NodeEventLogger} from './event-logger';

export class Node {
  private _mitosis: Mitosis;
  private _isSelected: boolean;
  private _networkStats: NetworkStats;
  private _messagesInLogger: NodeEventLogger<INodeMessageLog>;
  private _messagesOutLogger: NodeEventLogger<INodeMessageLog>;
  private _networkInLogger: NodeEventLogger<StatLogEvent>;
  private _networkOutLogger: NodeEventLogger<StatLogEvent>;
  private _latency = 1;
  private _stability = 1;

  constructor(mitosis: Mitosis) {
    this._mitosis = mitosis;
    this._networkStats = new NetworkStats(Simulation.getInstance().getClock());
    this._messagesInLogger = new NodeEventLogger<INodeMessageLog>();
    this._messagesOutLogger = new NodeEventLogger<INodeMessageLog>();
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

  public onReceiveMessage(message: IMessage, nodeId: string) {
    this._networkStats.updateTs(Simulation.getInstance().getClock().getTick());
    this._networkStats.addInComingMessage(message);
    this._messagesInLogger.add(
      new LogEvent<INodeMessageLog>(
        Simulation.getInstance().getClock().getTick(),
        {
          message: message,
          nodeId: nodeId,
          inComing: true
        }
      )
    );
    this._networkInLogger.addOrUpdateExisting(
      new LogEvent(
        Simulation.getInstance().getClock().getTick(),
        new StatLogEvent(
          {
            count: this._networkStats.getIncomingStat().getMessageCountForTs(),
            size: this._networkStats.getIncomingStat().getMessageSizeForTs(),
            totalCount: this._networkStats.getIncomingStat().getTotalMessageCount(),
            totalSize: this._networkStats.getIncomingStat().getTotalMessageSize()
          }
        )
      )
    );
  }

  public onSendMessage(message: IMessage, nodeId: string) {
    this._networkStats.updateTs(Simulation.getInstance().getClock().getTick());
    this._networkStats.addOutGoingMessage(message);
    this._messagesOutLogger.add(
      new LogEvent<INodeMessageLog>(
        Simulation.getInstance().getClock().getTick(), {
          message: message,
          nodeId: nodeId,
          inComing: false
        }
      )
    );
    this._networkOutLogger.addOrUpdateExisting(
      new LogEvent(
        Simulation.getInstance().getClock().getTick(),
        new StatLogEvent(
          {
            count: this._networkStats.getOutgoingStat().getMessageCountForTs(),
            size: this._networkStats.getOutgoingStat().getMessageSizeForTs(),
            totalCount: this._networkStats.getOutgoingStat().getTotalMessageCount(),
            totalSize: this._networkStats.getOutgoingStat().getTotalMessageSize()
          }
        )
      )
    );
  }

  public setLoggerMaxSize(maxSize: number) {
    this._messagesInLogger.setMaxSize(maxSize);
    this._messagesOutLogger.setMaxSize(maxSize);
    this._networkInLogger.setMaxSize(maxSize);
    this._networkOutLogger.setMaxSize(maxSize);
  }

  public getNetworkLatency(): number {
    return this._latency;
  }

  // Drop rate 0 <-> 100%
  public getNetworkStability(): number {
    return this._stability;
  }

  public setNetworkLatency(latency: number): void {
    this._latency = latency;
  }

  public setNetworkStability(stability: number): void {
    this._stability = stability;
  }

  public getMessagesInLogger(): NodeEventLogger<INodeMessageLog> {
    return this._messagesInLogger;
  }

  public getMessagesOutLogger(): NodeEventLogger<INodeMessageLog> {
    return this._messagesOutLogger;
  }

  public getNetworkInLogger(): NodeEventLogger<StatLogEvent> {
    return this._networkInLogger;
  }

  public getNetworkOutLogger(): NodeEventLogger<StatLogEvent> {
    return this._networkOutLogger;
  }

  public getNetworkStats(): { in: IStatEv, out: IStatEv } {
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

  public destroy() {
    this.getMitosis().destroy();
    this._messagesInLogger.flush();
    this._messagesOutLogger.flush();
    this._networkInLogger.flush();
    this._networkOutLogger.flush();
  }
}
