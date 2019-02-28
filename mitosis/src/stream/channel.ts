import {Subject} from 'rxjs';
import {IChannelAnnouncement} from '../message/interface';
import {IObservableMapEvent, ObservableMap} from '../util/observable-map';
import {TableView} from '../util/table-view';
import {Provider} from './provider';

export class Channel {

  private readonly _id: string;
  private readonly _providerPerId: ObservableMap<string, Provider>;

  public constructor(id: string) {
    this._id = id;
    this._providerPerId = new ObservableMap();
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

  public getActiveProvider(): Provider {
    return this._providerPerId
      .asTable()
      .find(
        provider => provider.isActive()
      );
  }

  public addProvider(provider: Provider): void {
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
    return this.getActiveProvider().getStream();
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

  public destroy(): void {
    this._providerPerId
      .forEach(
        provider => provider.destroy()
      );
    this._providerPerId.destroy();
  }
}
