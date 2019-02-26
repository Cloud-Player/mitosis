import {uuid} from 'mitosis';

export class MockMediaStream implements MediaStream {

  public id: string;
  public active = true;
  public ended = false;
  public onactive: ((this: MediaStream, ev: Event) => any) | null;
  public onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null;
  public oninactive: ((this: MediaStream, ev: Event) => any) | null;
  public onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null;

  constructor(id: string = uuid()) {
    this.id = id;
  }

  public addTrack(track: MediaStreamTrack): void {
  }

  public clone(): MediaStream {
    return new MockMediaStream();
  }

  public stop(): void {
  }

  public getAudioTracks(): Array<MediaStreamTrack> {
    return [];
  }

  public getTrackById(id: string): MediaStreamTrack {
    return null;
  }

  public getTracks(): Array<MediaStreamTrack> {
    return [];
  }

  public getVideoTracks(): Array<MediaStreamTrack> {
    return [];
  }

  public removeTrack(track: MediaStreamTrack): void {
  }

  public addEventListener(type: any, listener: any, options?: boolean | AddEventListenerOptions): void {
  }

  public dispatchEvent(event: Event): boolean {
    return false;
  }

  public removeEventListener(type: any, listener: any, options?: boolean | EventListenerOptions): void {
  }
}
