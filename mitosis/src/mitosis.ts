import {Subject} from 'rxjs';
import {IClock} from './clock/interface';
import {MasterClock} from './clock/master';
import {ConnectionState, IConnection, Protocol} from './connection/interface';
import {IEnclave} from './enclave/interface';
import {SecureEnclave} from './enclave/secure';
import {ChurnType} from './interface';
import {ILogger} from './logger/interface';
import {Logger} from './logger/logger';
import {Address} from './message/address';
import {AppContent} from './message/app-content';
import {IMessage} from './message/interface';
import {Message} from './message/message';
import {MessageBroker} from './message/message-broker';
import {PeerManager} from './peer/peer-manager';
import {RemotePeer} from './peer/remote-peer';
import {RemotePeerTable} from './peer/remote-peer-table';
import {RoleType} from './role/interface';
import {RoleManager} from './role/role-manager';
import {StreamManager} from './stream/stream-manager';

export class Mitosis {

  private _enclave: IEnclave;
  private _peerManager: PeerManager;
  private _streamManager: StreamManager;
  private _roleManager: RoleManager;
  private _messageBroker: MessageBroker;
  private _myId: string;
  private _myAddress: Address;
  private _signalAddress: Address;
  private _inbox: Subject<AppContent>;
  private _internalMessages: Subject<IMessage>;
  private _clock: IClock;
  private _logger: ILogger;

  public constructor(
    clock: IClock = null,
    enclave: IEnclave = null,
    address: string = null,
    signal: string = null,
    roles: Array<RoleType> = null
  ) {
    if (!clock) {
      clock = new MasterClock();
      clock.start();
    }
    this._clock = clock;
    if (!enclave) {
      enclave = new SecureEnclave();
    }

    this._enclave = enclave;
    if (address) {
      this._myAddress = Address.fromString(address);
      this._myId = this._myAddress.getId();
    } else {
      this._myId = `p${Math.round(1000 + Math.random() * 8999)}`;
      this._myAddress = new Address(this._myId);
    }

    if (!roles || !roles.length) {
      roles = [RoleType.NEWBIE];
    }
    this._roleManager = new RoleManager(this._myId, roles);

    if (!signal) {
      signal = this._roleManager.getConfiguration().DEFAULT_SIGNAL_ADDRESS;
    }
    this._signalAddress = Address.fromString(signal);

    this._peerManager = new PeerManager(this._myId, this._roleManager, this._clock.fork());
    this._streamManager = new StreamManager(this._myId, this._peerManager);
    this._messageBroker = new MessageBroker(this._peerManager, this._roleManager, this._streamManager);
    this._inbox = new Subject<AppContent>();
    this._internalMessages = new Subject<Message>();
    this.listenOnMessages();
    this.listenOnAppContentMessages();
    this.listenOnConnectionChurn();

    this._clock.setInterval(this.onTick.bind(this));
    this._logger = Logger.getLogger(this._myId);
    this._logger.setClock(this._clock);
    this._logger.info(`i am a ${roles.join(' and a ')}`);
  }

  private listenOnAppContentMessages(): void {
    this._messageBroker.observeAppContentMessages()
      .subscribe(
        (message: AppContent) => this._inbox.next(message)
      );
  }

  private listenOnMessages(): void {
    this._messageBroker.observeMessages()
      .subscribe(
        message => {
          this._roleManager.onMessage(this, message);
        });

    this._messageBroker.observeIncomingMessages()
      .subscribe(message => this._internalMessages.next(message));
  }

  private listenOnConnectionChurn(): void {
    this._peerManager
      .observePeerConnectionChurn()
      .subscribe(ev => {
        switch (ev.type) {
          case ChurnType.ADDED:
            this.listenOnConnectionStateChange(ev.connection);
            break;
          case ChurnType.REMOVED:
            break;
        }
      });
  }

  private listenOnConnectionStateChange(connection: IConnection) {
    connection.observeStateChange()
      .subscribe(
        state => {
          switch (state) {
            case ConnectionState.OPEN:
              this._streamManager.onConnectionOpen(connection);
              this._roleManager.onConnectionOpen(this, connection);
              break;
            case ConnectionState.CLOSED:
              this._streamManager.onConnectionClose(connection);
              this._roleManager.onConnectionClose(this, connection);
              break;
          }
        }
      );
  }

  private onTick(): void {
    try {
      this._roleManager.onTick(this);
    } catch (error) {
      this._logger.error(error.message, error);
      throw error;
    }
  }

  public getMyAddress(): Address {
    return this._myAddress;
  }

  public getSignalAddress(): Address {
    return this._signalAddress;
  }

  public getPeerTable(): RemotePeerTable {
    return this._peerManager.getPeerTable();
  }

  public getPeerManager(): PeerManager {
    return this._peerManager;
  }

  public getInbox(): Subject<AppContent> {
    return this._inbox;
  }

  public observeInternalMessages(): Subject<IMessage> {
    return this._internalMessages;
  }

  public getRoleManager(): RoleManager {
    return this._roleManager;
  }

  public getStreamManager(): StreamManager {
    return this._streamManager;
  }

  public sendMessageTo(peerId: string, message: any): void {
    const appMessage = new AppContent(
      this.getMyAddress(),
      new Address(peerId),
      message
    );
    this._peerManager.sendMessage(appMessage);
  }

  public destroy(): void {
    this._inbox.complete();
    this._internalMessages.complete();
    this._peerManager.destroy();
    this._streamManager.destroy();
    this._roleManager.destroy();
    this._messageBroker.destroy();
    this._clock.stop();
  }

  public toJSON(): { [key: string]: any } {
    const peerTable = this.getPeerManager().getPeerTable();
    const wssConnections = peerTable
      .aggregateConnections(
        table => table.filterByProtocol(Protocol.WEBSOCKET, Protocol.WEBSOCKET_UNSECURE)
      )
      .map(value => value.getAddress().getId());
    const webrtcDataConnections = peerTable
      .aggregateConnections(
        table => table.filterByProtocol(Protocol.WEBRTC_DATA)
      )
      .map(value => value.getAddress().getId());
    const webrtcStreamConnections = peerTable
      .aggregateConnections(
        table => table.filterByProtocol(Protocol.WEBRTC_STREAM)
      )
      .map(value => value.getAddress().getId());
    const channels = this.getStreamManager().getChannelTable().map(
      channel => {
        return {
          id: channel.getId(),
          providers: channel.getProviderTable().map(
            provider => {
              return {
                peerId: provider.getPeerId(),
                isActive: provider.isActive(),
                capacity: provider.getCapacity()
              };
            }
          )
        };
      }
    );

    return {
      id: this.getMyAddress().getId(),
      roles: this.getRoleManager().getRoles(),
      connections: {
        'wss': wssConnections,
        'webrtc-data': webrtcDataConnections,
        'webrtc-stream': webrtcStreamConnections
      },
      channels: channels
    };
  }
}

export * from './clock/interface';
export * from './connection/interface';
export * from './peer/interface';
export * from './message/interface';
export * from './role/interface';
export * from './logger/interface';
export * from './interface';
export * from './metering/interface';
export * from './stream/interface';
export * from './metering/connection-meter/interface';

export * from './configuration';

export {IClock} from './clock/interface';
export {AbstractClock} from './clock/clock';
export {MasterClock} from './clock/master';
export {ProtocolConnectionMap} from './connection/protocol-map';
export {IConnection} from './connection/interface';
export {AbstractConnection} from './connection/connection';
export {WebRTCConnection} from './connection/webrtc';
export {WebRTCStreamConnection} from './connection/webrtc-stream';
export {WebRTCDataConnection} from './connection/webrtc-data';
export {RemotePeer} from './peer/remote-peer';
export {Address} from './message/address';
export {Message} from './message/message';
export {AppContent} from './message/app-content';
export {ConnectionNegotiationType} from './message/connection-negotiation';
export {Logger} from './logger/logger';
export {uuid} from './util/uuid';
export {stringByteLength} from './util/string-functions';
export {IObservableMapEvent, ObservableMap} from './util/observable-map';
export {ConnectionMeter} from './metering/connection-meter/connection-meter';
export {TransmissionConnectionMeter} from './metering/connection-meter/transmission-connection-meter';
export {Channel} from './stream/channel';
export {Provider} from './stream/provider';
