import {IMessage, Mitosis, RoleType} from 'mitosis';
import {Node, NodeEventLogger, StatLogEvent, INodeMessageLog} from 'mitosis-simulation';
import {NodeModel} from '../../shared/components/d3-directed-graph/models/node-model';
import {D3DirectedGraphConfig} from '../../shared/src/d3-directed-graph-config';

export interface ILoggers {
  messagesOutLogger: NodeEventLogger<INodeMessageLog>;
  messagesInLogger: NodeEventLogger<INodeMessageLog>;
  networkInLogger: NodeEventLogger<StatLogEvent>;
  networkOutLogger: NodeEventLogger<StatLogEvent>;
}

export class SimulationNodeModel extends NodeModel {
  private _mitosis: Mitosis;
  private _loggers: ILoggers;
  private _simulationNode: Node;

  constructor(mitosis: Mitosis, loggers: ILoggers, simulationNode: Node) {
    super(mitosis.getMyAddress().getId());
    this._mitosis = mitosis;
    this._loggers = loggers;
    this._simulationNode = simulationNode;
  }

  public getMitosis() {
    return this._mitosis;
  }

  public getSimulationNode() {
    return this._simulationNode;
  }

  public getLoggers(): ILoggers {
    return this._loggers;
  }

  public toJSON() {
    return Object.assign(
      super.toJSON(),
      this._mitosis.toJSON()
    );
  }

  public textColorTransformer(): string {
    if (this._mitosis.getStreamManager().getChannelTable().has(channel => channel.isActive())) {
      const localChannel = this._mitosis.getStreamManager().getLocalChannel();
      if (localChannel && localChannel.getActiveProvider().getPeerId() === this._mitosis.getMyAddress().getId()) {
        return 'white';
      } else {
        return 'darkblue';
      }
    } else {
      return super.textColorTransformer();
    }
  }

  public textFontWeightTransformer(): string {
    if (this._mitosis.getStreamManager().getChannelTable().has(channel => channel.isActive())) {
      return 'bold';
    } else {
      return super.textFontWeightTransformer();
    }
  }

  public ellipseFillTransformer(): string {
    const roleManager = this._mitosis.getRoleManager();
    if (this._mitosis.getStreamManager().getLocalChannel()) {
      return D3DirectedGraphConfig.NODE_STREAMER_FILL_COLOR;
    } else if (roleManager.hasRole(RoleType.SIGNAL)) {
      return D3DirectedGraphConfig.NODE_ROLE_SIGNAL_FILL_COLOR;
    } else if (roleManager.hasRole(RoleType.ROUTER)) {
      return D3DirectedGraphConfig.NODE_ROLE_ROUTER_FILL_COLOR;
    } else if (roleManager.hasRole(RoleType.NEWBIE)) {
      return D3DirectedGraphConfig.NODE_ROLE_NEWBIE_FILL_COLOR;
    } else {
      return super.ellipseFillTransformer();
    }
  }
}
