import {Component, Input, OnInit} from '@angular/core';
import {Channel, StreamManager} from 'mitosis';
import {MockMediaStream, Simulation} from 'mitosis-simulation';
import {SimulationNodeModel} from '../../../src/simulation-node-model';

@Component({
  selector: 'app-stream-table',
  templateUrl: './stream-table.html',
  styleUrls: ['./stream-table.scss'],
})
export class StreamTableComponent implements OnInit {
  @Input()
  public selectedNode: SimulationNodeModel;

  @Input()
  public simulation: Simulation;

  constructor() {
  }

  private getStreamManager(): StreamManager {
    return this.selectedNode
      .getMitosis()
      .getStreamManager();
  }

  public startLocalStream(): void {
    this.getStreamManager().setLocalStream(new MockMediaStream());
  }

  public stopLocalStream(): void {
    this.getStreamManager().unsetLocalStream();
  }

  public stopRemoteStream(): void {
    this.getStreamManager()
      .getChannelTable()
      .filter(
        channel => channel !== this.getStreamManager().getLocalChannel()
      )
      .forEach(
        channel => channel
          .getProviderTable()
          .filter(
            provider => provider.isLive() && provider.isActive() && provider.isSink()
          )
          .forEach(
            provider => provider.getStream().stop()
          )
      );
  }

  public hasLocalStream(): boolean {
    return !!this.getStreamManager().getLocalChannel();
  }

  public isStreaming(): boolean {
    return this.getStreamManager()
      .getChannelTable()
      .has(
        channel => channel.isActive()
      );
  }

  public getChannelTitle(channel: Channel) {
    if (this.selectedNode) {
      const localChannel = this.selectedNode.getMitosis().getStreamManager().getLocalChannel();
      if (localChannel && localChannel.getId() === channel.getId()) {
        return 'my channel';
      }
      const activeProvider = channel.getActiveProvider();
      if (activeProvider) {
        const providerId = activeProvider.getPeerId();
        if (providerId !== this.selectedNode.getMitosis().getMyAddress().getId()) {
          return `channel from ${activeProvider.getPeerId()}`;
        }
      }
    }
    return 'unknown channel';
  }

  ngOnInit(): void {
  }
}
