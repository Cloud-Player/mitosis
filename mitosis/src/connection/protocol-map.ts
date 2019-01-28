import {IConnectionConstructor, Protocol} from './interface';
import {ViaConnection} from './via';
import {WebRTCDataConnection} from './webrtc-data';
import {WebRTCStreamConnection} from './webrtc-stream';
import {WebSocketConnection} from './websocket';

export const ProtocolConnectionMap: Map<Protocol, IConnectionConstructor> = new Map();
ProtocolConnectionMap.set(Protocol.WEBSOCKET, WebSocketConnection);
ProtocolConnectionMap.set(Protocol.WEBSOCKET_UNSECURE, WebSocketConnection);
ProtocolConnectionMap.set(Protocol.WEBRTC_DATA, WebRTCDataConnection);
ProtocolConnectionMap.set(Protocol.WEBRTC_STREAM, WebRTCStreamConnection);
ProtocolConnectionMap.set(Protocol.VIA, ViaConnection);
