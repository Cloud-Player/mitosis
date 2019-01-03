import {Subject} from 'rxjs';
import {IClock} from './clock/interface';
import {InternalClock} from './clock/internal';
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

  private _enclave: IEnclave;

  private _routingTable: RoutingTable;
  private _roleManager: RoleManager;
  private _messageBroker: MessageBroker;
  private _myId: string;
  private _myAddress: Address;
  private _inbox: Subject<Message>;

  public constructor(
    clock: IClock = new InternalClock(),
    enclave: IEnclave = new SecureEnclave(),
    address: string = null,
    roles: Array<RoleType> = [RoleType.NEWBIE]
  ) {
    this._enclave = enclave;
    if (address) {
      this._myAddress = Address.fromString(address);
      this._myId = this._myAddress.getId();
    } else {
      this._myId = `p${Math.round(100 + Math.random() * 899)}`;
      this._myAddress = new Address(this._myId);
    }
    console.log('hello i am', this._myAddress.toString());
    this._routingTable = new RoutingTable(this._myId);
    this._roleManager = new RoleManager(roles);
    this._messageBroker = new MessageBroker(this._routingTable, this._roleManager);
    this._inbox = new Subject();
    this.listenOnAppContentMessages();
    clock.onTick(this.onTick.bind(this));
  }

  private listenOnAppContentMessages() {
    this._messageBroker.observeAppContentMessages()
      .subscribe(
        message => this._inbox.next(message)
      );
  }

  private onTick(): void {
    this._roleManager.onTick(this);
  }

  public getMyAddress(): Address {
    return this._myAddress;
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
}

export * from './connection/interface';
export * from './mesh/interface';
export * from './mesh/remote-peer';
export * from './clock/interface';
export * from './clock/clock';
