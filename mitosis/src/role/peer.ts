import {Message} from '../message/message';
import {Mitosis} from '../mitosis';
import {IRole} from './interface';
import {publishPeerUpdate} from './task/publish-peer-update';
import {satisfyConnectionGoal} from './task/satisfy-connection-goal';

export class Peer implements IRole {

  public onTick(mitosis: Mitosis): void {
    satisfyConnectionGoal(mitosis);
    publishPeerUpdate(mitosis);
  }

  public onMessage(message: Message, mitosis: Mitosis): void {
  }
}
