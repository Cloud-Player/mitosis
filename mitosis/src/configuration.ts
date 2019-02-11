/* tslint:disable:max-classes-per-file */

import {RoleType} from './role/interface';
import {DefaultMap} from './util/default-map';

export class Configuration {
  public BROADCAST_ADDRESS = '*';
  public DEFAULT_SIGNAL_ADDRESS = 'mitosis/v1/p000/ws/localhost:8040/websocket';

  public DIRECT_CONNECTIONS_MIN_GOAL = 4;
  public DIRECT_CONNECTIONS_MAX_GOAL = 6;
  public DIRECT_CONNECTIONS_MAX = 10;

  public SLIDING_WINDOW_SIZE = 12;
  public TRANSMISSION_PING_INTERVAL = 4;
  public MAX_ROUTERS_PER_SIGNAL = 1;
  public LAST_SEEN_TIMEOUT = 30;

  public CONNECTION_METER_OPEN_GRACE_PERIOD_TIME = 10;
  public CONNECTION_METER_PROTECTION_TIME = 10;
  public CONNECTION_METER_PUNISHMENT_TIME = 20;
}

export const ConfigurationMap: DefaultMap<RoleType, Configuration> = new DefaultMap(new Configuration());
ConfigurationMap.set(RoleType.PEER, new Configuration());
ConfigurationMap.set(RoleType.PEER, new Configuration());
ConfigurationMap.set(RoleType.NEWBIE, new Configuration());
ConfigurationMap.set(RoleType.ROUTER, new Configuration());
ConfigurationMap.set(RoleType.SIGNAL, new Configuration());
