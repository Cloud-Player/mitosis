import {Address, ConnectionState, IConnectionOptions, Message, Protocol, WebRTCStreamConnection} from 'mitosis';
import {StreamConnector} from './connector/stream-connector';
import {DataConnector} from './connector/data-connector';

class Nucleus {
  private _streamConnector: StreamConnector;
  private _dataConnector: DataConnector;

  constructor() {
    this._streamConnector = new StreamConnector();
    this._dataConnector = new DataConnector();
  }
}

const nucleus = new Nucleus();
