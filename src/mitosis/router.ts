import {Offer} from './offer';
import {Peer} from './peer';

export class Router extends Peer {

  private peers: Peer[];
  private parent: Peer;
  private succession: Peer[];

  constructor () {
    this._peers = [];

  }
  public advertise(): void {
  }

  public introduce(offer: Offer): void {

  }
}
