import {Subject} from 'rxjs';
import {IClock} from './clock/interface';
import {MasterClock} from './clock/master';
import {IEnclave} from './enclave/interface';
import {SecureEnclave} from './enclave/secure';
import {Logger} from './logger/logger';
import {Configuration} from './mesh/configuration';
import {MessageBroker} from './mesh/message-broker';
import {RemotePeer} from './mesh/remote-peer';
import {RoleManager} from './mesh/role-manager';
import {RoutingTable} from './mesh/routing-table';
import {Address} from './message/address';
import {AppContent} from './message/app-content';
import {Message} from './message/message';
import {RoleType} from './role/interface';

export class Mitosis {

  private _enclave: IEnclave;
  private _routingTable: RoutingTable;
  private _roleManager: RoleManager;
  private _messageBroker: MessageBroker;
  private _myId: string;
  private _myAddress: Address;
  private _signalAddress: Address;
  private _inbox: Subject<AppContent>;
  private _internalMessages: Subject<Message>;
  private _clock: IClock;

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
      this._myId = `p${Math.round(100 + Math.random() * 899)}`;
      this._myAddress = new Address(this._myId);
    }
    if (!signal) {
      signal = Configuration.DEFAULT_SIGNAL_ADDRESS;
    }
    this._signalAddress = Address.fromString(signal);
    if (!roles || !roles.length) {
      roles = [RoleType.NEWBIE];
    }

    this._roleManager = new RoleManager(roles);
    this._routingTable = new RoutingTable(this._myId, this._clock.fork());
    this._messageBroker = new MessageBroker(this._routingTable, this._roleManager);
    this._inbox = new Subject<AppContent>();
    this._internalMessages = new Subject<Message>();
    this.listenOnMessages();
    this.listenOnAppContentMessages();

    this._clock.setInterval(this.onTick.bind(this));
    Logger.getLogger(this._myId).info(`i am a ${roles.join(' and a ')}`);
  }

  private listenOnAppContentMessages() {
    this._messageBroker.observeAppContentMessages()
      .subscribe(
        (message: AppContent) => this._inbox.next(message)
      );
  }

  private listenOnMessages() {
    this._messageBroker.observeMessages()
      .subscribe(message => this._roleManager.onMessage(message, this));

    this._messageBroker.observeIncomingMessages()
      .subscribe(message => this._internalMessages.next(message));
  }

  private onTick(): void {
    this._roleManager.onTick(this);
  }

  public getMyAddress(): Address {
    return this._myAddress;
  }

  public getSignalAddress(): Address {
    return this._signalAddress;
  }

  public getPeers(): Array<RemotePeer> {
    return this._routingTable.getPeers();
  }

  public getRoutingTable() {
    return this._routingTable;
  }

  public getInbox() {
    return this._inbox;
  }

  public observeInternalMessages() {
    return this._internalMessages;
  }

  public getRoles() {
    return this._roleManager.getRoles();
  }

  public sendMessageTo(peerId: string, message: any) {
    const appMessage = new AppContent(
      this.getMyAddress(),
      new Address(peerId),
      message
    );
    this._routingTable.sendMessage(appMessage);
  }

  public destroy() {
    this._inbox.complete();
    this._internalMessages.complete();
    this._routingTable.destroy();
    this._roleManager.destroy();
    this._messageBroker.destroy();
    this._clock.stop();
  }
}

export * from './clock/interface';
export * from './connection/interface';
export * from './mesh/interface';
export * from './message/interface';
export * from './role/interface';
export * from './logger/interface';

export {AbstractClock} from './clock/clock';
export {MasterClock} from './clock/master';
export {ProtocolConnectionMap} from './connection/protocol-map';
export {IConnection} from './connection/interface';
export {AbstractConnection} from './connection/connection';
export {WebRTCConnection} from './connection/webrtc';
export {WebRTCStreamConnection} from './connection/webrtc-stream';
export {WebRTCDataConnection} from './connection/webrtc-data';
export {RemotePeer} from './mesh/remote-peer';
export {Address} from './message/address';
export {Message} from './message/message';
export {AppContent} from './message/app-content';
export {Logger} from './logger/logger';
