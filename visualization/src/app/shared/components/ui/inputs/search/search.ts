import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs/internal/Subject';
import {Subscription} from 'rxjs/internal/Subscription';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-search-input',
  templateUrl: './search.html',
  styleUrls: ['./search.scss']
})
export class SearchInputComponent implements OnInit, OnDestroy {
  private searchTerms = new Subject<string>();
  private searchTermsSubscription: Subscription;

  public query: string;

  @Input()
  placeholder: string;

  @Output()
  valueChange: EventEmitter<string>;

  constructor() {
    this.valueChange = new EventEmitter<string>();
  }

  public searchOnInput(query: string) {
    this.query = query;
    this.searchTerms.next(query);
  }

  public reset() {
    this.query = '';
    this.searchTerms.next(null);
  }

  ngOnDestroy(): void {
    this.searchTermsSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.searchTermsSubscription =
      this.searchTerms
        .pipe(
          debounceTime(300),        // wait for 300ms pause in events
          distinctUntilChanged(),   // ignore if next search term is same as previous
          map(term => {
              if (term && term.length > 0) {
                this.valueChange.emit(term);
              } else {
                this.valueChange.emit(null);
              }
              return term || '';
            }
          )
        )
        .subscribe();
  }
}
