import {IMessage, Mitosis, RoleType} from 'mitosis';
import {NodeEventLogger, StatLogEvent} from 'mitosis-simulation';
import {NodeModel} from '../../shared/components/d3-directed-graph/models/node-model';
import {D3DirectedGraphConfig} from '../../shared/src/d3-directed-graph-config';

export interface ILoggers {
  messagesOutLogger: NodeEventLogger<IMessage>;
  messagesInLogger: NodeEventLogger<IMessage>;
  networkInLogger: NodeEventLogger<StatLogEvent>;
  networkOutLogger: NodeEventLogger<StatLogEvent>;
}

export class SimulationNodeModel extends NodeModel {
  private _mitosis: Mitosis;
  private _loggers: ILoggers;

  constructor(mitosis: Mitosis, loggers: ILoggers) {
    super(mitosis.getMyAddress().getId());
    this._mitosis = mitosis;
    this._loggers = loggers;
  }

  public getMitosis() {
    return this._mitosis;
  }

  public getLoggers(): ILoggers {
    return this._loggers;
  }

  public textColorTransformer(): string {
    if (this._mitosis.getStream()) {
      return 'brown';
    } else {
      return super.textColorTransformer();
    }
  }

  public textFontWeightTransformer(): string {
    if (this._mitosis.getStream()) {
      return 'bold';
    } else {
      return super.textFontWeightTransformer();
    }
  }

  public ellipseFillTransformer(): string {
    const roleManager = this._mitosis.getRoleManager();

    if (roleManager.hasRole(RoleType.SIGNAL)) {
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
