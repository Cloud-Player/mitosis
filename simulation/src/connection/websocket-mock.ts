import {Address, IConnection} from 'mitosis';
import {MockConnection} from './mock';

export class WebSocketMockConnection extends MockConnection implements IConnection {

  protected _quality = (Math.floor(Math.random() * 50) / 100);

  protected openClient(): void {
    this._client.addConnection(this._options.mitosisId, this._address.getId(), this);
    const remoteEdgeKey = [this._address.getId(), this._options.mitosisId].join('-');
    const remoteEdge = this._client.getEdgeMap().get(remoteEdgeKey);
    const remoteNode = this._client.getNodeMap().get(this._address.getId());

    if (!remoteNode) {
      throw new Error(`cannot connect to missing peer ${this._address.toString()}`);
    } else if (!remoteEdge) {
      const localAddress = new Address(
        this._options.mitosisId,
        this._address.getProtocol(),
        this._address.getLocation()
      );
      this._client.getClock().setTimeout(() => {
        remoteNode.getMitosis().getRoutingTable().connectTo(localAddress);
      }, this.getConnectionDelay());
    } else {
      this._client.getClock().setTimeout(() => {
        this._client.establishConnection(this._options.mitosisId, this._address.getId());
      }, this.getConnectionDelay());
    }
  }
}
