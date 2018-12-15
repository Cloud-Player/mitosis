export enum Protocol {
  WEBSOCKET = 'wss',
  WEBRTC = 'webrtc'
}

export enum MessageSubject {
  INTRODUCTION = 'intro',
  ROUTING_TABLE_UPDATE = 'rtu',
  PROMOTION = 'pro',
  CONNECTION_NEGOTIATION = 'cng'
}
