import {Injectable, NgZone} from '@angular/core';
import {debounce, isString} from 'underscore';
import {Subject} from 'rxjs';
import {EventLogger} from '../src/event-logger';
import {Message} from 'mitosis';

@Injectable()
export class MessageEventLogger {
  private _logger: EventLogger<Message>;

  constructor() {
    this._logger = new EventLogger();
  }

  public getLogger(): EventLogger<Message> {
    return this._logger;
  }

}
