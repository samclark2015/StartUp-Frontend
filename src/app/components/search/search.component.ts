import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  @Input() initialQuery = "";
  @Input() set content(value: string[]) {
    this._content = value;
    this.search(this.query, true);
  }
  get content(): string[] {
    return this._content;
  }
  @Output() searchResult = new EventEmitter<number>();

  private _query: string = this.initialQuery;
  private currIdx = -1;
  private matches: any[] = [];
  private _content: string[] = [];


  constructor() { }

  ngOnInit(): void {
  }

  search(query: string, reset?: boolean, reverse?: boolean) {
    let test = (x: string) => x.toLowerCase().includes(query.toLowerCase());

    if (reset) {
      this.matches = this.content.map((value, idx) => { return { value, idx } }).filter(o => test(o.value));
      this.currIdx = this.matches.length > 0 ? 0 : -1;
    } else {

      if (reverse) {
        this.currIdx -= 1;
      } else {
        this.currIdx += 1;
      }
    }

    if (this.currIdx < 0) {
      this.currIdx = this.matches.length - 1;
    } else if (this.currIdx >= this.matches.length) {
      this.currIdx = 0;
    }

    if (this.currIdx >= 0 && query != "") {
      let idx = this.matches[this.currIdx].idx;
      this.searchResult.emit(idx);
    } else {
      this.searchResult.emit(undefined);
    }
  }

  set query(q: string) {
    let reset = q != this._query;
    this._query = q;
    this.search(q, reset);
  }

  get query() {
    return this._query;
  }

}
