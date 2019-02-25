import {Message} from './message';

export enum ConnectionNegotiationType {
  REQUEST = 'request',
  OFFER = 'offer',
  ANSWER = 'answer',
  REJECT = 'reject'
}

export interface IConnectionNegotiationBody {
  type: ConnectionNegotiationType;
  sdp?: string;
  channelId?: string;
}

export class ConnectionNegotiation extends Message {

  protected _body: IConnectionNegotiationBody;

  public getBody(): IConnectionNegotiationBody {
    return this._body;
  }

  public getType(): ConnectionNegotiationType {
    if (this._body) {
      return this._body.type;
    }
  }
}
