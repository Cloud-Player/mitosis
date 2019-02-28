import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ConfigurationMap} from '../configuration';
import {ConnectionState, IConnection, IWebRTCStreamConnectionOptions, NegotiationState, Protocol} from '../connection/interface';
import {WebRTCConnection} from '../connection/webrtc';
import {WebRTCStreamConnection} from '../connection/webrtc-stream';
import {ChurnType} from '../interface';
import {Logger} from '../logger/logger';
import {Address} from '../message/address';
import {ConnectionNegotiation, ConnectionNegotiationType} from '../message/connection-negotiation';
import {IChannelAnnouncement, MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {PeerManager} from '../peer/peer-manager';
import {RoleType} from '../role/interface';
import {IObservableMapEvent, ObservableMap} from '../util/observable-map';
import {TableView} from '../util/table-view';
import {uuid} from '../util/uuid';
import {Channel} from './channel';

export class StreamManager {

  private readonly _myId: string;
  private _channelPerId: ObservableMap<string, Channel>;
  private _peerManager: PeerManager;

  constructor(myId: string, peerManager: PeerManager) {
    this._myId = myId;
    this._peerManager = peerManager;
    this._channelPerId = new ObservableMap();
    this.listenOnChannelChurn();
  }

  private cleanUpEmptyChannels(): void {
    this._channelPerId.observe()
      .pipe(
        filter(
          channelEvent => channelEvent.type === ChurnType.ADDED
        )
      )
      .subscribe(
        channelEvent => {
          const channel = channelEvent.value;
          channel.observeProviderChurn()
            .pipe(
              filter(
                providerEvent => providerEvent.type === ChurnType.REMOVED
              )
            )
            .subscribe(
              () => {
                if (channel.getProviderTable().length === 0) {
                  this.removeChannel(channel.getId());
                }
              }
            );
        }
      );
  }

  private pushMyOwnChannelsOut(): void {
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
        ev => this.pushStream(ev.value.getId(), ev.value.getActiveProvider().getStream())
      );
  }

  private listenOnChannelChurn(): void {
    this.cleanUpEmptyChannels();
    this.pushMyOwnChannelsOut();
  }

  private setCapacityForPeer(peerId: string, capacity: number): void {
    this._channelPerId
      .asTable()
      .forEach(
        channel => {
          const provider = channel.getOrSetProvider(peerId);
          provider.setCapacity(capacity);
        }
      );
  }

  private pushStreamTo(channelId: string, stream: MediaStream, peerId: string): void {
    const address = new Address(
      peerId,
      Protocol.WEBRTC_STREAM
    );
    const options: IWebRTCStreamConnectionOptions = {
      mitosisId: this._myId,
      channelId: channelId,
      stream: stream
    };
    this._peerManager
      .connectTo(address, options)
      .then(
        remotePeer => {
          Logger.getLogger(this._myId)
            .info(`pushing stream to ${remotePeer.getId()}`, remotePeer);
          const channel = this.getOrSetChannel(channelId);
          const provider = channel.getOrSetProvider(peerId);
          provider.setStream(stream);
        }
      )
      .catch((err) => {
        Logger.getLogger(this._myId)
          .info(`can not open stream to ${peerId}`, err);
      });
  }

  private pushStream(channelId: string, stream: MediaStream): void {
    this._peerManager
      .getPeerTable()
      .filterByRole(RoleType.PEER)
      .filter(
        peer => {
          if (this.getOrSetChannel(channelId).getProvider(peer.getId())) {
            return false;
          } else if (this.amIAlreadyStreamingTo(peer.getId())) {
            return false;
          }
          return true;
        }
      )
      .exclude(
        peers => peers
          .filterConnections(
            table => table
              .filterByProtocol(Protocol.WEBRTC_STREAM)
          )
      )
      .filterConnections(
        table => table
          .filterDirect()
          .filterByStates(ConnectionState.OPEN)
      )
      .sortByQuality()
      .reverse()
      .slice(0, this.getMyCapacity())
      .forEach(
        peer => this.pushStreamTo(channelId, stream, peer.getId())
      );
  }

  private onConnectionAddedStream(connection: WebRTCStreamConnection, stream: MediaStream): void {
    const channel = this.getOrSetChannel(connection.getChannelId());
    const peerId = connection.getAddress().getId();
    const provider = channel.getOrSetProvider(peerId);
    provider.setStream(stream);
    if (!connection.isInitiator()) {
      this.pushStream(channel.getId(), stream);
    }
  }

  private onConnectionRemovedStream(connection: WebRTCStreamConnection): void {
    const channel = this._channelPerId.get(connection.getChannelId());
    if (channel) {
      const peerId = connection.getAddress().getId();
      channel.removeProvider(peerId);
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

  public getOrSetChannel(channelId: string): Channel {
    let channel = this._channelPerId.get(channelId);
    if (!channel) {
      channel = new Channel(channelId);
      this._channelPerId.set(channel.getId(), channel);
      Logger.getLogger(this._myId).info(`adding channel ${channel.getId()}`, channel);
    }
    return channel;
  }

  public removeChannel(channelId: string): boolean {
    const channel = this._channelPerId.get(channelId);
    if (channel) {
      channel.destroy();
      Logger.getLogger(this._myId).info(`removing channel ${channel.getId()}`, channel);
    }
    return this._channelPerId.delete(channelId);
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
      const streamConnection = connection as WebRTCStreamConnection;
      const stream = streamConnection.getStream();
      if (stream) {
        this.onConnectionAddedStream(streamConnection, stream);
      }
      streamConnection.observeStreamChurn()
        .subscribe(
          ev => {
            switch (ev.type) {
              case ChurnType.ADDED:
                this.onConnectionAddedStream(streamConnection, ev.stream);
                break;
              case ChurnType.REMOVED:
                this.onConnectionRemovedStream(streamConnection);
                break;
            }
          }
        );
    }
  }

  public onConnectionClose(connection: IConnection): void {
    if (connection.getAddress().getProtocol() === Protocol.WEBRTC_STREAM) {
      const streamConnection = connection as WebRTCStreamConnection;
      this.onConnectionRemovedStream(streamConnection);
    }
  }

  public negotiateConnection(connectionNegotiation: ConnectionNegotiation): void {
    const logger = Logger.getLogger(this._myId);
    const senderAddress = connectionNegotiation.getSender();
    const receiverAddress = connectionNegotiation.getReceiver();
    const negotiation = connectionNegotiation.getBody();

    const rejection = new Message(
      receiverAddress,
      senderAddress,
      MessageSubject.CONNECTION_NEGOTIATION,
      {type: ConnectionNegotiationType.REJECTION, channelId: negotiation.channelId}
    );

    if (negotiation.type === ConnectionNegotiationType.OFFER) {
      if (negotiation.channelId) {
        const localChannel = this.getLocalChannel();
        if (localChannel && localChannel.getId() === negotiation.channelId) {
          logger.info('will not accept offer for my own channel', connectionNegotiation);
          this._peerManager.sendMessage(rejection);
          return;
        }
        const inboundConnectionsForChannel = this._peerManager.getPeerTable()
          .aggregateConnections(
            connections => connections
              .filterByProtocol(Protocol.WEBRTC_STREAM)
              .filterByStates(ConnectionState.OPENING, ConnectionState.OPEN)
              .filter(
                connection => connection.getNegotiationState() >= NegotiationState.WAITING_FOR_ANSWER
              )
              .filter(
                (connection: WebRTCStreamConnection) => connection.getChannelId() === negotiation.channelId
              )
              .filter(
                (connection: WebRTCConnection) => !connection.isInitiator()
              )
          );
        if (inboundConnectionsForChannel.length > 0) {
          logger.info('already got provider for this channel offer', connectionNegotiation);
          this._peerManager.sendMessage(rejection);
          return;
        }
      } else {
        logger.error('got stream offer without channel id', connectionNegotiation);
        return;
      }
    }

    const options: IWebRTCStreamConnectionOptions = {
      mitosisId: this._myId,
      channelId: negotiation.channelId,
      payload: {
        type: negotiation.type,
        sdp: negotiation.sdp
      }
    };
    switch (negotiation.type) {
      case ConnectionNegotiationType.REQUEST:
        if (this.getMyCapacity() > 0) {
          if (!this.amIAlreadyStreamingTo(senderAddress.getId())) {
            const channelId = negotiation.channelId;
            const channel = this._channelPerId.get(channelId);
            if (channel && channel.isActive()) {
              this.pushStreamTo(channelId, channel.getMediaStream(), senderAddress.getId());
            } else {
              logger.info(`no active stream for this channel, ignoring request from ${senderAddress.getId()}`, connectionNegotiation);
            }
          } else {
            logger.info(`already streaming to ${senderAddress.getId()}, ignoring request`, connectionNegotiation);
          }
        } else {
          logger.info(`no capacity to fulfill stream request from ${senderAddress.getId()}`, connectionNegotiation);
        }
        break;
      case ConnectionNegotiationType.OFFER:
        if (senderAddress.getProtocol() === Protocol.WEBRTC_STREAM) {
          (options as IWebRTCStreamConnectionOptions).channelId = connectionNegotiation.getBody().channelId;
        }
        this._peerManager.connectTo(senderAddress, options)
          .catch(
            error =>
              logger.warn(`stream offer connection to ${senderAddress} failed`, error)
          );
        break;
      case ConnectionNegotiationType.ANSWER:
        this._peerManager.connectTo(senderAddress).then(
          remotePeer => {
            const webRTCConnection: WebRTCConnection =
              remotePeer.getConnectionForAddress(senderAddress) as WebRTCConnection;
            if (webRTCConnection) {
              webRTCConnection.establish(options);
            } else {
              logger.error(`stream connection ${senderAddress.getLocation()} not found`, connectionNegotiation);
            }
          }
        ).catch(
          error =>
            logger.warn(`stream answer connection to ${senderAddress} failed`, error)
        );
        break;
      case ConnectionNegotiationType.REJECTION:
        this.setCapacityForPeer(senderAddress.getId(), 0);
        logger.info(`got stream rejection from ${senderAddress.getId()}, setting capacity 0`, connectionNegotiation);
        this._peerManager.getPeerById(senderAddress.getId())
          .getConnectionTable()
          .filterByLocation(receiverAddress.getLocation())
          .forEach(
            connection => {
              logger.warn(`stream connection negotiation rejected by ${senderAddress}`, connection);
              connection.close();
            }
          );
        break;
      default:
        throw new Error(
          `unsupported stream connection negotiation type ${negotiation.type}`
        );
    }
  }

  public getChannelTable(): TableView<Channel> {
    return this._channelPerId.asTable();
  }

  public getLocalChannel(): Channel {
    return this.getChannelTable()
      .find(
        channel => channel
          .getProviderTable()
          .has(
            provider => provider.getPeerId() === this._myId
          )
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
    const channel = this.getOrSetChannel(uuid());
    const provider = channel.getOrSetProvider(this._myId);
    provider.setStream(stream);
    Logger.getLogger(this._myId).info(`adding local channel ${channel.getId()}`, channel);
  }

  public unsetLocalStream(): void {
    const channel = this.getLocalChannel();
    if (channel) {
      this.removeChannel(channel.getId());
    }
  }

  public updateProviders(announcements: Array<IChannelAnnouncement>): void {
    announcements.forEach(
      announcement => {
        const channel = this.getOrSetChannel(announcement.channelId);
        announcement.providers.forEach(
          channelProvider => {
            if (
              channelProvider.peerId !== this._myId &&
              this._peerManager.getPeerById(channelProvider.peerId)
            ) {
              channel.getOrSetProvider(channelProvider.peerId);
              this.setCapacityForPeer(channelProvider.peerId, channelProvider.capacity);
            }
          }
        );
      }
    );
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
  }
}
