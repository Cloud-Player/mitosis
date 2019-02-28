import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable()
export class StreamService {

  private;
  private _currentStream: MediaStream;
  private _streamSubject = new Subject<MediaStream>();

  public getStream(): MediaStream {
    return this._currentStream;
  }

  public setStream(stream: MediaStream): void {
    this._currentStream = stream;
    this._streamSubject.next(stream);
  }

  public observe(): Subject<MediaStream> {
    return this._streamSubject;
  }
}
