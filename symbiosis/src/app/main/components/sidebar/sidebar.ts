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
        debugger;
        this.mitosis.setStream(stream);
      });
  }

  public stopStream() {
    this.mitosis.getStream().getTracks().forEach((track) => {
      track.stop();
    });
    this.mitosis.unsetStream();
  }

  ngOnInit(): void {
  }
}
