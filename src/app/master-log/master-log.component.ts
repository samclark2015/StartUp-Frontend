import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { FormGroup, FormControl } from '@angular/forms';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';


@Component({
  selector: 'app-master-log',
  templateUrl: './master-log.component.html',
  styleUrls: ['./master-log.component.scss']
})
export class MasterLogComponent implements OnInit {

  @ViewChild(VirtualScrollerComponent) scroll?: VirtualScrollerComponent;
  logEntries: any[] = [];
  messages: string[] = [];
  searchIdx?: number = undefined;

  filterForm = new FormGroup({
    text: new FormControl(''),
  })

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.fetch();
  }

  async fetch() {
    this.logEntries = (await this.api.fetchMasterLog().toPromise()).map(e => {
      return {
        type: 0,
        ...e
      }
    });
    this.messages = this.logEntries.map(e => e.message);
  }

  get maxUserWidth() {
    return Math.max.apply(Math, this.logEntries.map(o => o.user ? o.user.length : 0))
  }

  handleSearch(idx: number) {
    this.searchIdx = idx;
    if(idx != null) {
      this.scroll?.scrollToIndex(idx, undefined, -41);
    }
  }

}
