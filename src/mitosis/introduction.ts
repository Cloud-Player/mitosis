import {Message} from './message';
import {Offer} from './offer';
import {Router} from './router';

export class Introduction extends Message {

  private _offers: Offer[];
  private _router: Router;

  constructor(router: Router, ...offers: Offer[]) {
    super();
    this._offers = offers;
    this._router = router;
  }

  public get offers(): Offer[] {
    return this._offers;
  }

  public get router(): Router {
    return this._router;
  }
}
