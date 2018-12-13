import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {Connection, ConnectionEventTypes} from './connection';
import {ConnectionIn} from './connection-in';
import {ConnectionOut} from './connection-out';
import {SocketMessageService, SocketStatusTypes} from './socket';
import {Utils} from './utils';

export enum PeerEventType {
  ADD_CONNECTION,
  REMOVE_CONNECTION,
  MESSAGE,
  STREAM
}

export interface IPeerEvent {
  type: PeerEventType;
  body?: any;
}

export class Peer {
  private readonly _id: number;
  private _subject: Subject<IPeerEvent>;
  private _offers: Array<ConnectionOut>;
  private _connectedPeers: Array<{ peerId: number, connection: Connection }>;
  private _socket: SocketMessageService;
  private _stream: any;

  constructor(stream?: any) {
    this._id = Utils.getRandomInt(0, 1000);
    this._connectedPeers = [];
    this._offers = [];
    this._subject = new Subject<IPeerEvent>();
    this._socket = SocketMessageService.getInstance();
    this._stream = stream;
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
        switch (ev.body.content.type) {
          case 'offer':
            this.requestConnection(ev.body.content.content.initiator, ev.body.content.content.offer)
              .then((streamConnection: ConnectionIn) => {
                this.sendMessageTo(ev.body.content.content.initiator, {
                  initiator: ev.body.content.content.initiator,
                  answer: streamConnection.getAnswer(),
                  responder: this._id,
                  id: ev.body.content.content.id
                }, 'answer');
              });
            break;
          case 'answer':
            const answerWrapper = ev.body.content.content;
            let existingOffer: ConnectionOut;
            this._offers.forEach((offer) => {
              if (offer.getId() === answerWrapper.id) {
                existingOffer = offer;
              }
            });
            if (existingOffer) {
              this.establishConnection(answerWrapper.responder, existingOffer, answerWrapper.answer.sdp);
            }

            break;
          case 'message':
          default:
            this._subject.next({
              type: PeerEventType.MESSAGE,
              body: {
                from: peerID,
                message: ev.body.content
              }
            });
            break;
        }
      });

    connection.observe()
      .pipe(
        filter(event => event.type === ConnectionEventTypes.STREAM)
      )
      .subscribe((ev) => {
        console.log('STREAM');
        this._subject.next({
          type: PeerEventType.STREAM,
          body: {
            from: peerID,
            stream: ev.body
          }
        });
      });

    connection.observe()
      .pipe(
        filter(event => event.type === ConnectionEventTypes.CLOSE)
      )
      .subscribe((ev) => {
        const removePeers: Array<{ peerId: number, connection: Connection }> = [];
        this._connectedPeers.forEach((peer) => {
          if (peer.connection.getId() === connection.getId()) {
            removePeers.push(peer);
          }
        });
        removePeers.forEach((peer) => {
          this._connectedPeers.splice(this._connectedPeers.indexOf(peer), 1);
          this._subject.next({
            type: PeerEventType.REMOVE_CONNECTION,
            body: peer
          });
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

  private createOffer(stream?: any): Promise<{ id: number, offer: {} }> {
    return new Promise(() => {
      const connection = new ConnectionOut({stream: stream});
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

  public sendMessageTo(peerId: number, message: any, type?: any) {
    let existingPeer: { peerId: number, connection: Connection };
    this._connectedPeers.forEach((peer) => {
      if (peer.peerId === peerId) {
        existingPeer = peer;
      }
    });

    if (existingPeer) {
      existingPeer.connection.send(message, type);
    }
  }

  public broadcastStream(stream: any) {
    this._connectedPeers.forEach((connectedPeer) => {
      const connection = new ConnectionOut({stream: stream});
      this._offers.push(connection);

      connection.observe()
        .pipe(filter(ev => ev.type === ConnectionEventTypes.SETUP))
        .subscribe((ev) => {
          connectedPeer.connection.send({initiator: this.getId(), offer: connection.getOffer(), id: connection.getId()}, 'offer');
        });
    });
  }

  public getId() {
    return this._id;
  }
}
