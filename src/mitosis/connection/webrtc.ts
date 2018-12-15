import * as Peer from 'simple-peer';
import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {IConnection} from './interface';

export class WebRTCConnection extends AbstractConnection implements IConnection {

  public send(data: any): void {
  }

  protected closeClient(): void {
  }

  protected openClient(): void {
    const peer = new Peer({initiator: true, trickle: false});

    peer.on('signal', (data) => {
    });

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

  }
}
