import {Address, IClock, IConnection, IConnectionOptions, Logger} from 'mitosis';
import {MockMeter} from '../metering/mock-meter';
import {MockConnection} from './mock';

export class WebSocketMockConnection extends MockConnection implements IConnection {

  public constructor(address: Address, clock: IClock, options?: IConnectionOptions) {
    super(address, clock, options);
    this._meter = new MockMeter(this, clock, 1);
  }

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
        remoteNode
          .getMitosis()
          .getPeerManager()
          .connectTo(localAddress)
          .catch(error => Logger
            .getLogger('simulation')
            .warn(`connection to ${localAddress.getId()} failed`, error)
          );
      }, this.getConnectionDelay());
    } else {
      this._client.getClock().setTimeout(() => {
        this._client.establishConnection(this._options.mitosisId, this._address.getId(), this._address.getLocation());
      }, this.getConnectionDelay());
    }
  }
}
