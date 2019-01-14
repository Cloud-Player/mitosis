import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {IRole} from './interface';
import {publishRoutingTable} from './task/publish-routing-table';
import {satisfyConnectionGoal} from './task/satisfy-connection-goal';

export class Peer implements IRole {

  public onTick(mitosis: Mitosis): void {
    satisfyConnectionGoal(mitosis);
    publishRoutingTable(mitosis);
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }
}
