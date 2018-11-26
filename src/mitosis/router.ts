import {Offer} from './offer';
import {Peer} from './peer';

export abstract class Router extends Peer {

    peers: Peer[];
    upstream: Peer;
    succession: Peer[];

    abstract advertise(): void;

    abstract introduce(offer: Offer): void;
}
