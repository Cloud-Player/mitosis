import {Offer} from './offer';
import {Peer} from './peer';

export class Router extends Peer {

  private peers: Array<Peer>;
  private parent: Peer;
  private succession: Array<Peer>;

  constructor() {
    super();
    this.peers = [];
  }

  public advertise(): void {
  }

  public introduce(offer: Offer): void {

  }
}
