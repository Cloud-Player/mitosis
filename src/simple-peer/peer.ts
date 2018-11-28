import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {Connection, ConnectionEventTypes} from './connection';
import {ConnectionIn} from './connection-in';
import {ConnectionOut} from './connection-out';
import {SocketMessageService, SocketStatusTypes} from './socket';
import {Utils} from './utils';

export enum PeerEventType {
  ADD_CONNECTION,
  MESSAGE
}

export interface IPeerEvent {
  type: PeerEventType;
  body?: any;
}

export class Peer {
  private readonly _id: number;
  private _subject: Subject<IPeerEvent>;
  private _offers: Array<ConnectionOut>;
  private _connectedPeers: Array<{ peerId: number, connection: any }>;
  private _socket: SocketMessageService;

  constructor() {
    this._id = Utils.getRandomInt(0, 1000);
    this._connectedPeers = [];
    this._offers = [];
    this._subject = new Subject<IPeerEvent>();
    this._socket = SocketMessageService.getInstance();
    this.initSocket();
    this.createOffer();
  }

  private addConnection(peerID: number, connection: Connection) {
    const connectedPeer = {
      peerId: peerID,
      connection: connection
    };
    this._connectedPeers.push(connectedPeer);
    this._subject.next({
      type: PeerEventType.ADD_CONNECTION,
      body: connectedPeer
    });

    connection.observe()
      .pipe(
        filter(event => event.type === ConnectionEventTypes.MESSAGE)
      )
      .subscribe((ev) => {
        this._subject.next({
          type: PeerEventType.MESSAGE,
          body: {
            from: peerID,
            message: ev.body.content
          }
        });
      });
  }

  private initSocket() {
    this._socket.open('wss://signal.aux.app/websocket');
    this._socket.observe()
      .pipe(
        filter(ev => ev.type === SocketStatusTypes.MESSAGE)
      )
      .subscribe((ev) => {
        if (ev.detail.offer) {
          this.handleIncomingOffer(ev.detail);
        }

        if (ev.detail.answer) {
          this.handleIncomingAnswer(ev.detail);
        }
      });
  }

  private handleIncomingAnswer(answer: { responder: number, answer: any, id: number }) {
    let existingOffer: ConnectionOut;
    this._offers.forEach((offer) => {
      if (offer.getId() === answer.id) {
        existingOffer = offer;
      }
    });
    if (existingOffer) {
      this.establishConnection(answer.responder, existingOffer, answer.answer);
    }
  }

  private handleIncomingOffer(offer: { initiator: number, id: number, offer: any }) {
    this.requestConnection(offer.initiator, {
      type: 'offer',
      sdp: offer.offer
    }).then((connection: ConnectionIn) => {
      this._socket.sendMessage({
        initiator: offer.initiator,
        id: offer.id,
        answer: connection.getAnswer().sdp,
        responder: this._id
      });
    });
  }

  private createOffer(): Promise<{ id: number, offer: {} }> {
    return new Promise(() => {
      const connection = new ConnectionOut();
      this._offers.push(connection);
      connection.observe()
        .pipe(
          filter(ev => ev.type === ConnectionEventTypes.SETUP)
        )
        .subscribe((ev) => {
          this._socket.sendMessage({
            initiator: this._id,
            offers: [
              {
                id: connection.getId(),
                offer: connection.getOffer().sdp
              }
            ]
          });
        });
    });
  }

  private establishConnection(peerId: number, connection: ConnectionOut, answer: string) {
    connection.observe()
      .pipe(filter(ev => ev.type === ConnectionEventTypes.CONNECT))
      .subscribe(() => {
        this.addConnection(peerId, connection);
      });
    connection.establish({type: 'answer', sdp: answer});
    this._offers.splice(this._offers.indexOf(connection), 1);
  }

  private requestConnection(peerId: number, offer: { type: string, sdp: any }): Promise<ConnectionIn> {
    const connection = new ConnectionIn();
    connection.observe()
      .pipe(filter(ev => ev.type === ConnectionEventTypes.CONNECT))
      .subscribe(() => {
        this.addConnection(peerId, connection);
      });
    return connection.requestAnswer(offer)
      .then((answer) => {
        return connection;
      });
  }

  public observe() {
    return this._subject;
  }

  public broadcastMessage(message: any) {
    this._connectedPeers.forEach((connectedPeer) => {
      connectedPeer.connection.send(message);
    });
  }

  public sendMessageTo(peerId: number, message: any) {
    let existingPeer: { peerId: number, connection: Connection };
    this._connectedPeers.forEach((peer) => {
      if (peer.peerId === peerId) {
        existingPeer = peer;
      }
    });

    if (existingPeer) {
      existingPeer.connection.send(message);
    }
  }

  public getId() {
    return this._id;
  }
}
