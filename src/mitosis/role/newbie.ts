import {IConnection} from '../connection/interface';
import {Address} from '../message/address';
import {MessageSubject, Protocol} from '../message/interface';
import {Message} from '../message/message';
import {IRole} from './interface';
import {AbstractRole} from './role';

export class Newbie extends AbstractRole implements IRole {

  static readonly signalAddress = Address.fromString('mitosis/v1/wss/signal.aux.app/websocket');

  protected _onTick(): void {
  }

  protected _initialise(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._routingTable.connectTo(Newbie.signalAddress).then((connection: IConnection) => {
          const myAddress = new Address(Protocol.WEBSOCKET, this._routingTable.getMyId());
          connection.send(new Message(myAddress, Newbie.signalAddress, MessageSubject.INTRODUCTION, '👻'));
          console.log('OPEN');
        }
      );
    });
  }
}
