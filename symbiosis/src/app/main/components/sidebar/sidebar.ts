import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Mitosis} from 'mitosis';
import {SearchInputComponent} from '../../../shared/components/ui/inputs/search/search';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent implements OnInit {
  @Input()
  public mitosis: Mitosis;

  @ViewChild('searchInput')
  public searchEl: SearchInputComponent;

  constructor() {
  }

  public startStream() {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then(
      (stream: MediaStream) => {
        this.mitosis.getStreamManager().setLocalStream(stream);
      });
  }

  public stopStream() {
    this.mitosis.getStreamManager().unsetLocalStream();
  }

  public hasLocalStream(): boolean {
    return !!this.mitosis.getStreamManager().getLocalStream();
  }

  ngOnInit(): void {
  }
}
