import {Peer} from './peer';

export abstract class Message {

    source: Peer;
    destination: Peer;
}
