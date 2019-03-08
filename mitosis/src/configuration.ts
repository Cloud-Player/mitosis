/* tslint:disable:max-classes-per-file */

import {RoleType} from './role/interface';
import {DefaultMap} from './util/default-map';

export class Configuration {
  public BROADCAST_ADDRESS = '*';
  public DEFAULT_SIGNAL_ADDRESS = 'mitosis/v1/p000/wss/signal.aux.app/websocket';

  public DIRECT_CONNECTIONS_MIN_GOAL = 4;
  public DIRECT_CONNECTIONS_MAX_GOAL = 6;
  public DIRECT_CONNECTIONS_MAX = 10;
  public TRY_OTHER_PEERS_COUNT = 2;

  public SLIDING_WINDOW_SIZE = 12;
  public TRANSMISSION_PING_INTERVAL = 4;
  public MAX_ROUTERS_PER_SIGNAL = 1;
  public LAST_SEEN_TIMEOUT = 30;

  public CONNECTION_METER_OPEN_GRACE_PERIOD_TIME = 10;
  public CONNECTION_METER_PROTECTION_TIME = 10;
  public CONNECTION_METER_PUNISHMENT_TIME = 20;

  public OUTBOUND_STREAM_CONNECTIONS = 2;

  public ROUTER_ALIVE_HIGHSCORE_WINDOW_SIZE = 10;
}

export const ConfigurationMap: DefaultMap<RoleType, Configuration> = new DefaultMap(() => new Configuration());
