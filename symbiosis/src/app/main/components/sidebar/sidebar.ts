import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {SearchInputComponent} from '../../../shared/components/ui/inputs/search/search';
import {Mitosis} from 'mitosis';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent implements OnInit {
  private searchNode: string;

  @Input()
  public mitosis: Mitosis;


  @ViewChild('searchInput')
  public searchEl: SearchInputComponent;

  constructor() {
  }

  public search(nodeId: string) {
    this.searchNode = nodeId;
  }

  ngOnInit(): void {
  }
}
