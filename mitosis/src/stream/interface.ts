export interface IMediaStream {
  id: string;
  active: boolean;
  ended: boolean;
  onaddtrack: (ev: MediaStreamTrackEvent) => void;
  onremovetrack: (ev: MediaStreamTrackEvent) => void;

  addTrack(track: MediaStreamTrack): void;

  clone(): IMediaStream;

  getAudioTracks(): Array<MediaStreamTrack>;

  getTrackById(id: string): MediaStreamTrack;

  getTracks(): Array<MediaStreamTrack>;

  getVideoTracks(): Array<MediaStreamTrack>;

  removeTrack(track: MediaStreamTrack): void;
}
