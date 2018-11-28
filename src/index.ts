import {filter} from 'rxjs/operators';
import {Connection} from './simple-peer/connection';
import {Peer, PeerEventType} from './simple-peer/peer';

const peer = new Peer();

peer.observe()
  .pipe(
    filter(ev => ev.type === PeerEventType.ADD_CONNECTION)
  )
  .subscribe((ev) => {
    (ev.body as Connection).send('JO JO WAS GEHT');
  });

peer.observe()
  .pipe(
    filter(ev => ev.type === PeerEventType.MESSAGE)
  )
  .subscribe((ev) => {
    console.log(peer.getId(), 'GOT MESSAGE', ev.body);
  });

// var Peer = require('simple-peer')
//
// var peer1 = new Peer({ initiator: true })
// var peer2 = new Peer()
//
// peer1.on('signal', function (data) {
//   // when peer1 has signaling data, give it to peer2 somehow
//   console.log(data);
//   peer2.signal(data)
// })
//
// peer2.on('signal', function (data) {
//   // when peer2 has signaling data, give it to peer1 somehow
//   peer1.signal(data)
// })
//
// peer1.on('connect', function () {
//   // wait for 'connect' event before using the data channel
//   peer1.send('hey peer2, how is it going?')
// })
//
// peer2.on('data', function (data) {
//   // got a data channel message
//   console.log('got a message from peer1: ' + data)
// })

// const peer2 = new Peer(0);
//
// const obsPeer1 = Observable.create((observer: Observer<Connection>) => {
//   peer1.observe()
//     .pipe(
//       filter(ev => ev.type === PeerEventType.CONNECTIONS_CREATED)
//     )
//     .subscribe(() => {
//       observer.next(peer1.getConnections()[0]);
//       observer.complete();
//     });
// });
//
// const obsPeer2 = Observable.create((observer: Observer<Connection>) => {
//   peer2.observe()
//     .pipe(
//       filter(ev => ev.type === PeerEventType.CONNECTIONS_CREATED)
//     )
//     .subscribe(() => {
//       observer.next(peer2.getConnections()[0]);
//       observer.complete();
//     });
// });
//
// peer1.observe().pipe(
//   filter(ev => ev.type === PeerEventType.CONNECTION_ESTABLISHED)
// ).subscribe(() => {
//   peer1.broadcastMessage('HELLO FROM PEER 1');
// });
//
// peer1.observe().pipe(
//   filter(ev => ev.type === PeerEventType.MESSAGE)
// ).subscribe((ev) => {
//   console.log('PEER 1 GOT MESSAGE ' + ev.body.content.toString());
// });
//
// peer2.observe().pipe(
//   filter(ev => ev.type === PeerEventType.CONNECTION_ESTABLISHED)
// ).subscribe(() => {
//   peer2.broadcastMessage('HELLO FROM PEER 2');
// });
//
// peer2.observe().pipe(
//   filter(ev => ev.type === PeerEventType.MESSAGE)
// ).subscribe((ev) => {
//   console.log('PEER 2 GOT MESSAGE ' + ev.body.content.toString());
// });
//
// Promise.all([
//   obsPeer1.toPromise()
// ]).then((connections) => {
//   const connectionPeer1: ConnectionOut = connections[0];
//   peer2.requestConnection(connectionPeer1.getOffer())
//     .then((connection: ConnectionIn) => {
//       connectionPeer1.establish(connection.getAnswer());
//     });
// });
