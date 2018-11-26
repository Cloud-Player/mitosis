import {Connection} from './connection';

export abstract class Peer {

    id: string;
    connections: Connection[];
}
