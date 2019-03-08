import {stringByteLength} from '../util/string-functions';
import {Address} from './address';
import {IMessage, MessageSubject, MessageTtls} from './interface';

export class Message implements IMessage {

  private _id: string;
  private _receiver: Address;
  private _sender: Address;
  private _ttl: number;
  private _inboundAddress: Address;
  private _subject: MessageSubject;
  protected _body: any;

  public constructor(sender: Address, receiver: Address, subject: MessageSubject, body: any, id?: string, ttl?: number) {
    this._sender = sender;
    this._receiver = receiver;
    this._subject = subject;
    this._body = body;
    this._id = id || `m${Math.round(1000 + Math.random() * 8999)}`;
    this._ttl = ttl || MessageTtls.get(subject);
  }

  public static fromString(messageString: string): Message {
    const messageJSON = JSON.parse(messageString);
    return new Message(
      Address.fromString(messageJSON.sender),
      Address.fromString(messageJSON.receiver),
      messageJSON.subject as MessageSubject,
      messageJSON.body,
      messageJSON.id,
      messageJSON.ttl
    );
  }

  public get length() {
    return stringByteLength(this.toString());
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

  public getTtl(): number {
    return this._ttl;
  }

  public decreaseTtl(): number {
    return --this._ttl;
  }

  public setInboundAddress(address: Address): void {
    this._inboundAddress = address;
  }

  public clone(): Message {
    return new Message(
      this._sender,
      this._receiver ,
     this._subject ,
     this._body ,
     this._id ,
     this._ttl
    );
  }

  public toString(): string {
    return JSON.stringify({
        id: this._id,
        receiver: this.getReceiver().toString(),
        sender: this.getSender().toString(),
        subject: this.getSubject(),
        ttl: this.getTtl(),
        body: this.getBody()
      },
      undefined,
      2
    );
  }
}
