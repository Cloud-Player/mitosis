import {Answer} from './answer';
import {Offer} from './offer';
import {Peer} from './peer';

export abstract class Signal extends Peer {

    abstract introduce(offer: Offer): Answer;
}
