import {Address, IConnection} from 'mitosis';
import {MockConnection} from './mock';

export class WebSocketMockConnection extends MockConnection implements IConnection {

  protected openClient(): void {
    this._client.addConnection(
      this._options.mitosisId,
      this._address.getId(),
      this._address.getLocation(),
      this);

    const remoteEdge = this._client.getEdge(this._address.getId(), this._options.mitosisId, this._address.getLocation());
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
        this._client.establishConnection(this._options.mitosisId, this._address.getId(), this._address.getLocation());
      }, this.getConnectionDelay());
    }
  }

  public getQuality(): number {
    return 0.1;
  }
}
