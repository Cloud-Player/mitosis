import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Channel, ChurnType, IObservableMapEvent, IPeerChurnEvent, Mitosis, Provider} from 'mitosis';
import {Subject, Subscription} from 'rxjs';
import {throttleTime} from 'rxjs/operators';

@Injectable()
export class ReportingService {
  private _mitosis: Mitosis;
  private _subscriptions: Subscription;
  private _updateReady: Subject<any>;
  private _interval;

  constructor(private http: HttpClient) {
    this._subscriptions = new Subscription();
    this._updateReady = new Subject();
    this._updateReady
      .pipe(
        throttleTime(250)
      )
      .subscribe(
        this.sendToReportServer.bind(this)
      );
  }

  private unsubscribe() {
    this._subscriptions.unsubscribe();
    this._subscriptions = new Subscription();
  }

  private subscribe() {
    this._subscriptions.add(
      this._mitosis
        .getPeerManager()
        .observePeerChurn()
        .subscribe(this.onPeerChurn.bind(this))
    );

    this._subscriptions.add(
      this._mitosis
        .getRoleManager()
        .observeRoleChurn()
        .subscribe(this.onRoleChurn.bind(this))
    );

    this._subscriptions.add(
      this._mitosis
        .getStreamManager()
        .observeChannelChurn()
        .subscribe(this.onChannelChurn.bind(this))
    );
  }

  private onRoleChurn() {
    this.publish();
  }

  private onPeerChurn(ev: IPeerChurnEvent) {
    if (ev.type === ChurnType.ADDED) {
      this._subscriptions.add(
        ev.peer
          .observeChurn()
          .subscribe(this.onConnectionChurn.bind(this))
      );
    }
    this.publish();
  }

  private onConnectionChurn() {
    this.publish();
  }

  private onChannelChurn(ev: IObservableMapEvent<Channel>) {
    if (ev.type === ChurnType.ADDED) {
      this._subscriptions.add(
        (ev.value as Channel)
          .observeProviderChurn()
          .subscribe(this.onProviderChurn.bind(this))
      );
    }
    this.publish();
  }

  private onProviderChurn(ev: IObservableMapEvent<Provider>) {
    this.publish();
  }

  private sendToReportServer(data: any) {
    this.http.post('https://signal.mitosis.dev/reporting', data).subscribe();
  }

  private publish() {
    this._updateReady.next(this._mitosis.toJSON());
  }

  public setMitosis(mitosis: Mitosis) {
    if (this._mitosis) {
      this.unsubscribe();
    }
    if (this._interval) {
      clearInterval(this._interval);
    }
    this._mitosis = mitosis;
    this.subscribe();
    this.publish();
    setInterval(this.publish.bind(this), 2000);
  }
}
