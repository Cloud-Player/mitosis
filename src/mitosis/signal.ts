import {Introduction} from './introduction';
import {Offer} from './offer';
import {Peer} from './peer';
import {Router} from './router';

export class Signal extends Peer {

  private readonly routers: Array<Router>;

  constructor() {
    super();
    this.routers = [];
  }

  private getRandomRouter(): Router {
    if (this.routers.length) {
      return this.routers[Math.floor(Math.random() * this.routers.length)];
    } else {
      return null;
    }
  }

  public introduce(offer: Offer): Introduction {
    const router = this.getRandomRouter();
    const answer = router.introduce(offer);
    return new Introduction(router, offer);
  }
}
