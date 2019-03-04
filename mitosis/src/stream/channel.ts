import {Subject} from 'rxjs';
import {IChannelAnnouncement} from '../message/interface';
import {IObservableMapEvent, ObservableMap} from '../util/observable-map';
import {TableView} from '../util/table-view';
import {IStreamChurnEvent} from './interface';
import {Provider} from './provider';

export class Channel {

  private readonly _id: string;
  private readonly _providerPerId: ObservableMap<string, Provider>;
  private readonly _streamChurnSubject: Subject<IStreamChurnEvent>;

  public constructor(id: string) {
    this._id = id;
    this._providerPerId = new ObservableMap();
    this._streamChurnSubject = new Subject();
  }

  public isActive(): boolean {
    return this._providerPerId
      .asTable()
      .has(
        provider => provider.isActive()
      );
  }

  public getId(): string {
    return this._id;
  }

  public isLive(): boolean {
    return this._providerPerId
      .asTable()
      .has(
        provider => provider.isLive()
      );
  }

  public addProvider(provider: Provider): void {
    provider.observeStreamChurn()
      .subscribe(
        (ev: IStreamChurnEvent) => this._streamChurnSubject.next(
          {
            type: ev.type,
            stream: ev.stream,
            channelId: this._id
          })
      );
    this._providerPerId.set(provider.getPeerId(), provider);
  }

  public removeProvider(peerId: string): boolean {
    const provider = this.getProvider(peerId);
    if (provider) {
      provider.destroy();
    }
    return this._providerPerId.delete(peerId);
  }

  public getOrSetProvider(peerId: string): Provider {
    let provider = this.getProvider(peerId);
    if (!provider) {
      provider = new Provider(peerId);
      this.addProvider(provider);
    }
    return provider;
  }

  public getProvider(peerId: string): Provider {
    return this._providerPerId.get(peerId);
  }

  public getProviderTable(): TableView<Provider> {
    return this._providerPerId.asTable();
  }

  public getMediaStream(): MediaStream {
    const source = this._providerPerId
      .asTable()
      .find(
        provider => provider.isActive() && provider.isLive() && provider.isSource()
      );
    if (source) {
      return source.getStream();
    }
  }

  public asAnnouncement(): IChannelAnnouncement {
    return {
      channelId: this._id,
      providers: this._providerPerId
        .asTable()
        .map(
          provider => {
            return {
              peerId: provider.getPeerId(),
              capacity: provider.getCapacity()
            };
          }
        )
    };
  }

  public observeProviderChurn(): Subject<IObservableMapEvent<Provider>> {
    return this._providerPerId.observe();
  }

  public observeStreamChurn(): Subject<IStreamChurnEvent> {
    return this._streamChurnSubject;
  }

  public destroy(): void {
    this._providerPerId
      .forEach(
        provider => provider.destroy()
      );
    this._providerPerId.destroy();
    this._streamChurnSubject.complete();
  }

  public toString(): string {
    return JSON.stringify({
        id: this._id,
        providers: this._providerPerId.keysAsList()
      },
      undefined,
      2
    );
  }
}
