import {Message} from './message';

export abstract class Offer extends Message {
    payload: string;
}
