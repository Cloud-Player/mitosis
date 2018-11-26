import {Message} from './message';
import {Peer} from './peer';

export abstract class Advertisement extends Message {

    succession: Peer[];
}
