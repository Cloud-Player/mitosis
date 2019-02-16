import {Mitosis} from '../mitosis';
import {IRole} from './interface';
import {AbstractRole} from './role';
import {broadcastStream} from './task/broadcast-stream';

export class Streamer extends AbstractRole implements IRole {

  public onInit(mitosis: Mitosis): void {
    broadcastStream(mitosis);
  }
}
