import {RemotePeerTable} from '../peer/remote-peer-table';

export interface IMeter {

  getQuality(remotePeers: RemotePeerTable): number;

  start(): void;

  stop(): void;
}
