import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {IRole} from './interface';

export class Signal implements IRole {

  public onTick(mitosis: Mitosis): void {
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }
}
