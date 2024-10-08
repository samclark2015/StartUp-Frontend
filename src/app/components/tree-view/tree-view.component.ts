import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import _ from 'lodash';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SubscriptionDelegate } from 'src/app/subscription-delegate';

export interface TreeItem {
  title: string;
  subtitle?: string;
  value?: any;
  children?: TreeItem[];
  selected: boolean;
}

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
})
export class TreeViewComponent extends SubscriptionDelegate implements OnInit {

  @Input() public items: TreeItem[] = [];
  @Input() public title?: string;
  @Input() public query?: string;
  @Input() public debounceMs: number = 200;

  @Output() public search = new EventEmitter<string>();
  @Output() public selectItem = new EventEmitter<[string | string[], boolean]>();

  @ViewChild("scroll") private scrollElement?: VirtualScrollerComponent;

  private inputSubject = new Subject<string>();
  private collapsedItems: Set<TreeItem> = new Set();

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.subscribe(this.inputSubject.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged()
    ), (v) => {
      this.search.emit(v);
    });
  }

  get hasSearchListener() {
    return this.search.observers.length > 0;
  }

  handleClick(item: TreeItem, event: MouseEvent) {
    if (item.value !== undefined) {
      if (event.shiftKey) {
        // Shift-click selects or deselects a range...
        let idx = _.findIndex(this.items, { value: item.value });
        if (idx < 0) return;

        let first = _.findIndex(this.items, { selected: true });
        let last = _.findLastIndex(this.items, { selected: true });

        let selection;
          if (idx < first) {
          selection = this.items.slice(idx, last + 1)
        } else {
          selection = this.items.slice(first, idx + 1);
        }
        let values = selection.map(item => item.value);
        this.selectItem.emit([values, true]);
      } else {
        // If not shift, we're selecting 1 item (and maybe appending it)
        this.selectItem.emit([item.value, event.altKey || event.metaKey || event.ctrlKey]);
      }
    }
  }

  handleSearch(evt: any) {
    this.inputSubject.next(evt.target.value);
  }

  handleCollapse(event: any, item: TreeItem) {
    event.stopPropagation();
    this.toggleCollapsed(item);
  }

  tracker(index: number, item: TreeItem) {
    return item.value;
  }

  isCollapsed(item: TreeItem) {
    return this.collapsedItems.has(item.value);
  }

  public scrollToItemWithValue(value: any) {
    let idx = this.items.findIndex(item => item.value == value);
    if (idx >= 0) {
      this.scrollElement?.scrollToIndex(idx, true);
    }

  }

  private toggleCollapsed(item: TreeItem) {
    if (this.isCollapsed(item)) {
      this.collapsedItems.delete(item.value);
    } else {
      this.collapsedItems.add(item.value);
    }
  }

}
