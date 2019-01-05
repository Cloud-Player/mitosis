import {Subject} from 'rxjs';
import {IClock} from './clock/interface';
import {MasterClock} from './clock/master';
import {IEnclave} from './enclave/interface';
import {SecureEnclave} from './enclave/secure';
import {MessageBroker} from './mesh/message-broker';
import {RemotePeer} from './mesh/remote-peer';
import {RoleManager} from './mesh/role-manager';
import {RoutingTable} from './mesh/routing-table';
import {Address} from './message/address';
import {AppContent} from './message/app-content';
import {Message} from './message/message';
import {RoleType} from './role/interface';

export class Mitosis {

  private static readonly defaultSignal = 'mitosis/v1/p007/ws/localhost:8040/websocket';
  private static readonly defaultRoles = [RoleType.NEWBIE];

  private _enclave: IEnclave;
  private _routingTable: RoutingTable;
  private _roleManager: RoleManager;
  private _messageBroker: MessageBroker;
  private _myId: string;
  private _myAddress: Address;
  private _signalAddress: Address;
  private _inbox: Subject<Message>;
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
      signal = Mitosis.defaultSignal;
    }
    this._signalAddress = Address.fromString(signal);
    if (!roles || !roles.length) {
      roles = Mitosis.defaultRoles;
    }
    this._roleManager = new RoleManager(roles);

    this._routingTable = new RoutingTable(this._myId);
    this._messageBroker = new MessageBroker(this._routingTable, this._roleManager);
    this._inbox = new Subject();
    this.listenOnMessages();
    this.listenOnAppContentMessages();

    console.log(
      'hello, i am',
      this._myAddress.toString(),
      'and i am a',
      roles.join(' and a '));

    clock.setInterval(this.onTick.bind(this));
    this._clock = clock;
  }

  private listenOnAppContentMessages() {
    this._messageBroker.observeAppContentMessages()
      .subscribe(
        message => this._inbox.next(message)
      );
  }

  private listenOnMessages() {
    this._messageBroker.observeMessages()
      .subscribe(message => this._roleManager.onMessage(message, this));
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

  public sendMessageTo(peerId: string, message: any) {
    const appMessage = new AppContent(
      this.getMyAddress(),
      new Address(peerId),
      message
    );
    this._routingTable.sendMessage(appMessage);
  }

  public destroy() {
    this._routingTable.destroy();
    this._clock.stop();
  }
}

export * from './clock/interface';
export * from './connection/interface';
export * from './mesh/interface';
export * from './message/interface';
export * from './role/interface';

export {AbstractClock} from './clock/clock';
export {MasterClock} from './clock/master';
export {AbstractConnection} from './connection/connection';
export {RemotePeer} from './mesh/remote-peer';
export {Address} from './message/address';
export {Message} from './message/message';
