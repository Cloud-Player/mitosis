export class Configuration {
  public static readonly BROADCAST_ADDRESS = '*';
  public static readonly DIRECT_CONNECTIONS_GOAL = 5;
  public static readonly DIRECT_CONNECTIONS_MAX = 10;
  public static readonly DEFAULT_SIGNAL_ADDRESS = 'mitosis/v1/p000/ws/localhost:8040/websocket';
  public static readonly ROUTER_REDIRECT_ALTERNATIVE_COUNT = 5;
  public static readonly TRANSMISSION_PING_INTERVAL = 4;
  public static readonly SLIDING_WINDOW_SIZE = 12;
  public static readonly CONNECTION_METER_OPEN_GRACE_PERIOD_TIME = 10;
  public static readonly CONNECTION_METER_PROTECTION_TIME = 10;
  public static readonly CONNECTION_METER_PUNISHMENT_TIME = 20;
  public static readonly MAX_ROUTERS_PER_SIGNAL = 1;
}
