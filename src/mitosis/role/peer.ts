import {Address} from '../address/address';
import {IRole} from './interface';
import {AbstractRole} from './role';

export class Peer extends AbstractRole implements IRole {

  protected _onTick(): void {
  }

  protected _initialise(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const signalAddress = Address.fromString('mitosis/v1/peer/1/wss/signal.aux.app');
      this._routingTable.connectTo(signalAddress).then(
        // TODO: sendMyOffer, waitForAnswer, connectToRouter, disconnectFromSignal
      );
    });
  }
}
