import {IMediaStream, uuid} from 'mitosis';

export class MockMediaStream implements IMediaStream {

  public id: string;
  public active = true;
  public ended = false;
  public onaddtrack: () => void;
  public onremovetrack: () => void;

  constructor(id: string = uuid()) {
    this.id = id;
  }

  public addTrack(track: MediaStreamTrack): void {
  }

  public clone(): IMediaStream {
    return new MockMediaStream(this.id);
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
}
