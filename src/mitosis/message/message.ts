import {Address} from './address';
import {MessageSubject} from './interface';

export class Message {
  private _receiver: Address;
  private _sender: Address;
  private _subject: MessageSubject;
  private _body: any;

  public static fromString(messageString: string): Message {
    const messageJSON = JSON.parse(messageString);
    return new Message(
      Address.fromString(messageJSON.sender),
      Address.fromString(messageJSON.receiver),
      messageJSON.subject as MessageSubject,
      messageJSON.body
    );
  }

  public constructor(sender: Address, receiver: Address, subject: MessageSubject, body: any) {
    this._sender = sender;
    this._receiver = receiver;
    this._subject = subject;
    this._body = body;
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

  public toString(): string {
    return JSON.stringify(
      {
        receiver: this.getReceiver().toString(),
        sender: this.getSender().toString(),
        subject: this.getSubject() as string,
        body: this.getBody()
      }
    );
  }
}
