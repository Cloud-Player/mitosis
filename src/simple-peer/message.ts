export class Message {
  private from: number;
  private content: any;

  constructor(from: number, content: any) {
    this.from = from;
    this.content = content;
  }
}
