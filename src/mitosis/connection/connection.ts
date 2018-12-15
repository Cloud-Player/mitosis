import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {IConnection} from './interface';

export abstract class AbstractConnection {
  private _onOpenResolver: (connection: IConnection) => void;
  private _onOpenRejector: () => void;
  protected _address: Address;
  protected _subject: Subject<any>;

  public constructor(address: Address) {
    this._address = address;
  }

  protected abstract openClient(): void;

  protected abstract closeClient(): void;

  public getQuality(): number {
    return .0;
  }

  public getAddress(): Address {
    return this._address;
  }

  public onOpen(connection: IConnection) {
    if (this._onOpenResolver) {
      this._onOpenResolver(connection);
      this._onOpenResolver = null;
      this._onOpenRejector = null;
    }

    this.publish('OPEN');
  }

  public onClose() {
    if (this._onOpenRejector) {
      this._onOpenRejector();
      this._onOpenResolver = null;
      this._onOpenRejector = null;
    }

    this.publish('CLOSE');
    this._subject.complete();
  }

  public onError() {
    this.publish('ERROR');
  }

  public onMessage(message: Message) {
    this._subject.next(message);
  }

  public close() {
    this.closeClient();
  }

  public open(): Promise<IConnection> {
    return new Promise<IConnection>((resolve, reject) => {
      this._onOpenResolver = resolve;
      this._onOpenRejector = reject;
      this.openClient();
    });
  }

  private publish(value: any): void {
    if (this._subject) {
      this._subject.next(value);
    }
  }

  public observe() {
    return this._subject;
  }
}
