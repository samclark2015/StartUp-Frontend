import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
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
  @Input() public debounceMs: number = 200;


  @Output() public search = new EventEmitter<string>();
  @Output() public select = new EventEmitter<string>();

  @ViewChild("scroll") private scrollElement?: VirtualScrollerComponent;

  private inputSubject = new Subject<string>();
  private collapsedItems: Set<TreeItem> = new Set();

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.addSub(this.inputSubject.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged()
    ).subscribe((value) => this.search.emit(value)));
  }

  get hasSearchListener() {
    return this.search.observers.length > 0;
  }

  handleClick(item: TreeItem) {
    if (item.value != null) {
      this.select.emit(item.value);
    }
  }

  handleSearch(evt: any) {
    this.inputSubject.next(evt.target.value);
  }

  handleCollapse(event: any, item: TreeItem) {
    event.stopPropagation();
    this.toggleCollapsed(item);
  }

  tracker(item: TreeItem) {
    return item.value;
  }

  isCollapsed(item: TreeItem) {
    return this.collapsedItems.has(item.value);
  }

  public scrollToItemWithValue(value: any) {
    let idx = this.items.findIndex(item => item.value == value);
    if (idx < 0)
      return;
    this.scrollElement?.scrollToIndex(idx, false);
  }

  private toggleCollapsed(item: TreeItem) {
    if (this.isCollapsed(item)) {
      this.collapsedItems.delete(item.value);
    } else {
      this.collapsedItems.add(item.value);
    }
  }

}
