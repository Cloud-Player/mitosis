interface IConnection {
  getQuality(): number;

  send(data: any): void;
}
