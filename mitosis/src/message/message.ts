import {Address} from './address';
import {MessageSubject} from './interface';

export class Message {
  private _receiver: Address;
  private _sender: Address;
  private _subject: MessageSubject;
  private _id: string;
  protected _body: any;

  public static fromString(messageString: string): Message {
    const messageJSON = JSON.parse(messageString);
    return new Message(
      Address.fromString(messageJSON.sender),
      Address.fromString(messageJSON.receiver),
      messageJSON.subject as MessageSubject,
      messageJSON.body,
      messageJSON.id
    );
  }

  public constructor(sender: Address, receiver: Address, subject: MessageSubject, body: any, id?: string) {
    this._sender = sender;
    this._receiver = receiver;
    this._subject = subject;
    this._body = body;
    this._id = id || `m${Math.round(100 + Math.random() * 899)}`;
  }

  public getReceiver(): Address {
    return this._receiver;
  }

  public getSender(): Address {
    return this._sender;
  }

  public getSubject(): MessageSubject {
    return this._subject;
  }

  public getBody(): any {
    return this._body;
  }

  public getId(): string {
    return this._id;
  }

  public toString(): string {
    return JSON.stringify(
      {
        id: this._id,
        receiver: this.getReceiver().toString(),
        sender: this.getSender().toString(),
        subject: this.getSubject() as string,
        body: this.getBody()
      },
      undefined,
      2
    );
  }
}
