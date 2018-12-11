export abstract class Connection implements IConnection {

  private _peerId: number;

  public getQuality(): number {
    return .0;
  }

  public send(data: any): void {
  }
}
