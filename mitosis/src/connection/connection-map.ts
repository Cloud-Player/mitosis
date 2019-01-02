import {IConnectionConstructor} from './interface';
import {WebSocketConnection} from './websocket';
import {WebRTCConnection} from './webrtc';
import {Protocol} from '../message/interface';

export const ConnectionTypeMap: Map<Protocol, IConnectionConstructor> = new Map();
ConnectionTypeMap.set(Protocol.WEBSOCKET, WebSocketConnection);
ConnectionTypeMap.set(Protocol.WEBRTC, WebRTCConnection);
