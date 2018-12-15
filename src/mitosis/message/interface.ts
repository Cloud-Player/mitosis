export enum Protocol {
  WEBSOCKET_UNSECURE = 'ws',
  WEBSOCKET = 'wss',
  WEBRTC = 'webrtc',
  VIA = 'via'
}

export enum MessageSubject {
  PEER_UPDATE = 'peer-update',
  ROLE_UPDATE = 'role-update',
  CONNECTION_NEGOTIATION = 'connection-negotiation',
  APP_CONTENT = 'app-content'
}
