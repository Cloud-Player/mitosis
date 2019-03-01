import {stringByteLength} from '../util/string-functions';
import {Address} from './address';
import {IMessage, MessageSubject} from './interface';

export class Message implements IMessage {
  private _receiver: Address;
  private _sender: Address;
  private _inboundAddress: Address;
  private _subject: MessageSubject;
  private _id: string;
  protected _body: any;

  public constructor(sender: Address, receiver: Address, subject: MessageSubject, body: any, id?: string) {
    this._sender = sender;
    this._receiver = receiver;
    this._subject = subject;
    this._body = body;
    this._id = id || `m${Math.round(100 + Math.random() * 899)}`;
  }

  public get length() {
    return stringByteLength(this.toString());
  }

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

  public getReceiver(): Address {
    return this._receiver;
  }

  public getSender(): Address {
    return this._sender;
  }

  public getInboundAddress(): Address {
    return this._inboundAddress;
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

  public setInboundAddress(address: Address): void {
    this._inboundAddress = address;
  }

  public toString(): string {
    return JSON.stringify({
        id: this._id,
        receiver: this.getReceiver().toString(),
        sender: this.getSender().toString(),
        subject: this.getSubject(),
        body: this.getBody()
      },
      undefined,
      2
    );
  }
}
