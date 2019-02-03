/* tslint:disable:max-classes-per-file */

import {RoleType} from './role/interface';

export class Globals {
  public static readonly BROADCAST_ADDRESS = '*';
  public static readonly DEFAULT_SIGNAL_ADDRESS = 'mitosis/v1/p000/ws/localhost:8040/websocket';
  public static readonly SLIDING_WINDOW_SIZE: number = 12;
  public static readonly TRANSMISSION_PING_INTERVAL: number = 4;
  public static readonly MAX_ROUTERS_PER_SIGNAL: number = 1;
}

export class Configuration {
  public static readonly DIRECT_CONNECTIONS_MIN_GOAL: number = 4;
  public static readonly DIRECT_CONNECTIONS_MAX_GOAL: number = 6;
  public static readonly DIRECT_CONNECTIONS_MAX: number = 10;
  public static readonly CONNECTION_METER_OPEN_GRACE_PERIOD_TIME: number = 10;
  public static readonly CONNECTION_METER_PROTECTION_TIME: number = 10;
  public static readonly CONNECTION_METER_PUNISHMENT_TIME: number = 20;
  public static readonly LAST_SEEN_TIMEOUT: number = 30;
}

export class SignalConfiguration extends Configuration {
  public static readonly DIRECT_CONNECTIONS_MIN_GOAL: number = 0;
  public static readonly DIRECT_CONNECTIONS_MAX_GOAL: number = 10;
}

export const RoleConfigurationMap: Map<RoleType, typeof Configuration> = new Map();
RoleConfigurationMap.set(RoleType.PEER, Configuration);
RoleConfigurationMap.set(RoleType.NEWBIE, Configuration);
RoleConfigurationMap.set(RoleType.ROUTER, Configuration);
RoleConfigurationMap.set(RoleType.SIGNAL, SignalConfiguration);
