import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {TabPaneComponent} from '../tab-pane/tab-pane';
import {isUndefined} from 'underscore';

@Component({
  selector: 'app-tab-bar',
  styleUrls: ['./tab-bar.scss'],
  templateUrl: './tab-bar.html'
})
export class TabBarComponent implements OnInit, OnChanges {
  private _selectedTabIndex;
  private _savedSelectedTabIndex;

  public tabs: TabPaneComponent[];

  @Input()
  public id: string;

  @Input()
  public activeTabId: string;

  @Input()
  public showTabBar = true;

  @Output()
  public tabChange: EventEmitter<TabPaneComponent>;

  constructor() {
    this.tabs = [];
    this.tabChange = new EventEmitter();
  }

  private static saveSavedTabIndex(id: string, selectedTab: boolean) {
    if (!id) {
      return;
    }
    return localStorage.setItem(`tab-${id}`, JSON.stringify(selectedTab));
  }

  private static getSavedTabIndex(id: string) {
    if (!id) {
      return;
    }
    const selectedTab = localStorage.getItem(`tab-${id}`);
    if (!isUndefined(selectedTab)) {
      return JSON.parse(selectedTab);
    }
  }

  private setInitialSelectedTab() {
    if (!isUndefined(this._savedSelectedTabIndex)) {
      this.activeTabId = this._savedSelectedTabIndex;
      this.selectTabByIndex(this._savedSelectedTabIndex);
    } else if (this.activeTabId) {
      this.selectTabById(this.activeTabId);
    } else {
      this.selectTabByIndex(0);
    }
  }

  public addTab(tab: TabPaneComponent) {
    this.tabs.push(tab);
    this.setInitialSelectedTab();
  }

  public removeTab(tab: TabPaneComponent) {
    this.tabs.every((tabPane, index) => {
      if (tab === tabPane) {
        this.tabs.splice(index, 1);
        return false;
      } else {
        return true;
      }
    });
  }

  public selectTab(tab: TabPaneComponent) {
    if (tab) {
      const previousSelectedTab = this.tabs[this._selectedTabIndex];
      if (previousSelectedTab) {
        previousSelectedTab.deSelect();
      }

      tab.select();
      this._selectedTabIndex = this.tabs.indexOf(tab);
      TabBarComponent.saveSavedTabIndex(this.id, this._selectedTabIndex);
      this.tabChange.emit(tab);
    }
  }

  public selectTabById(id: string) {
    this.tabs.every((tab: TabPaneComponent) => {
      if (tab.id === id) {
        this.selectTab(tab);
        return false;
      } else {
        return true;
      }
    });
  }

  public selectTabByIndex(index: number) {
    if (index >= 0 && index < this.tabs.length && index !== this._selectedTabIndex) {
      this.selectTab(this.tabs[index]);
    }
  }

  ngOnInit(): void {
    this._savedSelectedTabIndex = TabBarComponent.getSavedTabIndex(this.id);
    this.setInitialSelectedTab();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeTabIndex) {
      this.selectTabById(changes.activeTabIndex.currentValue);
    } else if (changes.activeTabId) {
      this.selectTabById(changes.activeTabId.currentValue);
    }
  }
}
