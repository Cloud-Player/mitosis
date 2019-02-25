import {Component, Input, OnInit} from '@angular/core';
import {Channel, IConnection, Protocol} from 'mitosis';
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

  public startStream(): void {
    this.selectedNode
      .getMitosis()
      .getStreamManager()
      .setLocalStream(new MockMediaStream());
  }

  public stopStream(): void {
    this.selectedNode
      .getMitosis()
      .getStreamManager()
      .unsetLocalStream();
  }

  public isStreaming(): boolean {
    return this.selectedNode
      .getMitosis()
      .getStreamManager()
      .getChannelTable()
      .has(
        channel => channel.isActive()
      );
  }

  public getChannelAnnotation(channel: Channel) {
    let text = '';
    if (this.selectedNode) {
      const localChannel = this.selectedNode.getMitosis().getStreamManager().getLocalChannel();
      if (localChannel && localChannel.getId() === channel.getId()) {
        text += 'mine ';
      }
      const activeProvider = channel.getActiveProvider();
      if (activeProvider) {
        const providerId = activeProvider.getPeerId();
        if (providerId !== this.selectedNode.getMitosis().getMyAddress().getId()) {
          text += `from ${activeProvider.getPeerId()} `;
        }
      }
    }
    return text;
  }

  ngOnInit(): void {
  }
}
