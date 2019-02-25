import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ConfigurationMap} from '../configuration';
import {ConnectionState, IConnection, IWebRTCStreamConnectionOptions, Protocol} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {WebRTCStreamConnection} from '../connection/webrtc-stream';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {ConnectionNegotiationType, IConnectionNegotiationBody} from '../message/connection-negotiation';
import {IChannelAnnouncement, IMessage, MessageSubject} from '../message/interface';
import {PeerManager} from '../peer/peer-manager';
import {RoleType} from '../role/interface';
import {IObservableMapEvent, ObservableMap} from '../util/observable-map';
import {TableView} from '../util/table-view';
import {Channel} from './channel';
import {IStreamChurnEvent} from './interface';
import {Provider} from './provider';

export class StreamManager {

  private readonly _myId: string;
  private _channelPerId: ObservableMap<string, Channel>;
  private _peerManager: PeerManager;
  private _streamSubject: Subject<IStreamChurnEvent>;

  constructor(myId: string, peerManager: PeerManager) {
    this._myId = myId;
    this._peerManager = peerManager;
    this._streamSubject = new Subject();
    this._channelPerId = new ObservableMap();
    this.listenOnChannelChurn();
  }

  private listenOnChannelChurn(): void {
    this._channelPerId.observe()
      .pipe(
        filter(
          ev => {
            if (ev.type === ChurnType.ADDED) {
              const provider = ev.value.getActiveProvider();
              if (provider && provider.getPeerId() === this._myId) {
                return true;
              }
            }
            return false;
          }
        )
      )
      .subscribe(
        ev => this.pushStream(ev.value.getActiveProvider().getStream())
      );

    this._channelPerId.observe()
      .pipe(
        filter(
          channelEvent => channelEvent.type === ChurnType.ADDED
        )
      )
      .subscribe(
        channelEvent => {
          channelEvent.value.observeProviderChurn()
            .pipe(
              filter(
                providerEvent => providerEvent.type === ChurnType.REMOVED
              )
            )
            .subscribe(
              providerEvent => {
                if (channelEvent.value.getProviderTable().length === 0) {
                  this._channelPerId.delete(channelEvent.value.getId());
                }
              }
            );
        }
      );
  }

  private setCapacityForProvider(peerId: string, capacity: number): void {
    this._channelPerId
      .asTable()
      .forEach(
        channel => {
          let provider = channel.getProvider(peerId);
          if (!provider) {
            provider = new Provider(peerId);
            channel.addProvider(provider);
          }
          provider.setCapacity(capacity);
        }
      );
  }

  private pushStreamTo(stream: MediaStream, peerId: string): void {
    const address = new Address(
      peerId,
      Protocol.WEBRTC_STREAM
    );
    const options: IWebRTCStreamConnectionOptions = {
      mitosisId: this._myId,
      channelId: stream.id,
      stream: stream
    };
    this._peerManager
      .connectTo(address, options)
      .then(
        candidate => {
          Logger.getLogger(this._myId)
            .info(`pushing stream to ${candidate.getId()}`, candidate);
        }
      )
      .catch((err) => {
        Logger.getLogger(this._myId)
          .info(`can not open stream to ${peerId}`, err);
      });
  }

  private pushStream(stream: MediaStream): void {
    this._peerManager
      .getPeerTable()
      .filterByRole(RoleType.PEER)
      .exclude(
        table =>
          table
            .filterConnections(
              connections => connections.filterByProtocol(Protocol.WEBRTC_STREAM)
            )
      )
      .filterConnections(
        table =>
          table
            .filterDirect()
            .filterByStates(ConnectionState.OPEN)
      )
      .sortByQuality()
      .reverse()
      .slice(0, this.getMyCapacity())
      .forEach(
        peer => this.pushStreamTo(stream, peer.getId())
      );
  }

  private onStreamReady(connection: WebRTCStreamConnection, stream: MediaStream): void {
    let channel = this._channelPerId.get(stream.id);
    if (!channel) {
      channel = new Channel(stream.id);
      this._channelPerId.set(stream.id, channel);
    }
    const peerId = connection.getAddress().getId();
    let provider = channel.getProvider(peerId);
    if (provider) {
      provider.setStream(stream);
      this._streamSubject.next({type: ChurnType.ADDED, stream: stream});
    } else {
      provider = new Provider(peerId, stream);
      channel.addProvider(provider);
    }
    if (!connection.isInitiator()) {
      this.pushStream(stream);
    }
  }

  private amIAlreadyStreamingTo(peerId: string): boolean {
    const requester = this._peerManager.getPeerById(peerId);
    if (requester) {
      return requester
        .getConnectionTable()
        .filterByProtocol(Protocol.WEBRTC_STREAM)
        .length > 0;
    }
    return false;
  }

  public getMyCapacity(): number {
    const outboundStreamCount = this._peerManager
      .getPeerTable()
      .countConnections(
        table => table
          .filterByStates(ConnectionState.OPENING, ConnectionState.OPEN)
          .filterByProtocol(Protocol.WEBRTC_STREAM)
          .filter(
            connection => (connection as WebRTCConnection).isInitiator()
          )
      );
    const config = ConfigurationMap.getDefault();
    return Math.max(0, config.OUTBOUND_STREAM_CONNECTIONS - outboundStreamCount);
  }

  public onConnectionOpen(connection: IConnection): void {
    if (connection.getAddress().getProtocol() === Protocol.WEBRTC_STREAM) {
      (connection as WebRTCStreamConnection)
        .getStream()
        .then(
          stream => this.onStreamReady(connection as WebRTCStreamConnection, stream)
        );
    }
  }

  public onConnectionClose(connection: IConnection): void {
    if (connection.getAddress().getProtocol() === Protocol.WEBRTC_STREAM) {
      (connection as WebRTCStreamConnection)
        .getStream()
        .then(
          stream => {
            const channel = this._channelPerId.get(stream.id);
            if (channel) {
              channel.removeProvider(connection.getAddress().getId());
            }
          }
        );
    }
  }

  public onMessage(message: IMessage): void {
    if (message.getSubject() === MessageSubject.CONNECTION_NEGOTIATION) {
      const body: IConnectionNegotiationBody = message.getBody();

      const logger = Logger.getLogger(this._myId);
      const sender = message.getSender().getId();
      if (body.type === ConnectionNegotiationType.REQUEST) {
        if (this.getMyCapacity() > 0) {
          if (!this.amIAlreadyStreamingTo(sender)) {
            const channelId = body.channelId;
            const channel = this._channelPerId.get(channelId);
            if (channel && channel.isActive()) {
              this.pushStreamTo(channel.getMediaStream(), sender);
            } else {
              logger.info(`no active stream for this channel either, ignoring request from ${sender}`, message);
            }
          } else {
            logger.info(`already streaming to ${sender}, ignoring request`, message);
          }
        } else {
          logger.info(`no capacity to fulfill stream request from ${sender}`, message);
        }
      } else if (body.type === ConnectionNegotiationType.REJECT) {
        this.setCapacityForProvider(sender, 0);
        logger.info(`got reject from ${sender}, setting capacity 0`, message);
      }
    }
  }

  public getChannelTable(): TableView<Channel> {
    return this._channelPerId.asTable();
  }

  public getLocalChannel(): Channel {
    return this._channelPerId
      .valuesAsList()
      .find(
        channel => {
          const provider = channel.getActiveProvider();
          if (provider) {
            return provider.getPeerId() === this._myId;
          }
          return false;
        }
      );
  }

  public getLocalStream(): MediaStream {
    const channel = this.getLocalChannel();
    if (channel) {
      return channel.getMediaStream();
    }
  }

  public setLocalStream(stream: MediaStream): void {
    this.unsetLocalStream();
    const channel = new Channel(stream.id);
    const provider = new Provider(this._myId, stream);
    channel.addProvider(provider);
    this._channelPerId.set(channel.getId(), channel);
    this._streamSubject.next({type: ChurnType.ADDED, stream: stream});
  }

  public unsetLocalStream(): void {
    const channel = this.getLocalChannel();
    if (channel) {
      channel.destroy();
      this._channelPerId.delete(channel.getId());
    }
  }

  public updateProviders(announcements: Array<IChannelAnnouncement>): void {
    announcements.forEach(
      announcement => {
        let channel = this._channelPerId.get(announcement.channelId);
        if (!channel) {
          channel = new Channel(announcement.channelId);
          this._channelPerId.set(channel.getId(), channel);
        }
        announcement.providers.forEach(
          channelProvider => {
            if (
              channelProvider.peerId !== this._myId &&
              this._peerManager.getPeerById(channelProvider.peerId)
            ) {
              let provider = channel.getProvider(channelProvider.peerId);
              if (!provider) {
                provider = new Provider(channelProvider.peerId);
                channel.addProvider(provider);
              }
              this.setCapacityForProvider(channelProvider.peerId, channelProvider.capacity);
            }
          }
        );
      }
    );
  }

  public observeStreamChurn(): Subject<IStreamChurnEvent> {
    return this._streamSubject;
  }

  public observeChannelChurn(): Subject<IObservableMapEvent<Channel>> {
    return this._channelPerId.observe();
  }

  public destroy(): void {
    this._channelPerId
      .forEach(
        channel => channel.destroy()
      );
    this._channelPerId.destroy();
    this._streamSubject.complete();
  }
}
