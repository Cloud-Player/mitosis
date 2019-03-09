import {Injectable, NgZone} from '@angular/core';
import {debounce, isString} from 'underscore';
import {Subject} from 'rxjs';
import {EventLogger} from '../src/event-logger';
import {ILogEvent} from 'mitosis';

@Injectable()
export class LogEventLogger {
  private _logger: EventLogger<ILogEvent>;

  constructor() {
    this._logger = new EventLogger();
  }

  public getLogger(): EventLogger<ILogEvent> {
    return this._logger;
  }

}
