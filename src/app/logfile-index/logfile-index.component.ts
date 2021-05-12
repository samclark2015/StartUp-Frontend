import { Component, ComponentRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { ApiService } from '../api.service';
import { TreeItem } from '../components/tree-view/tree-view.component';
import { SubscriptionDelegate } from '../subscription-delegate';

@Component({
  selector: 'app-logfile-index',
  templateUrl: './logfile-index.component.html',
  styleUrls: ['./logfile-index.component.scss']
})
export class LogfileIndexComponent extends SubscriptionDelegate implements OnInit, OnDestroy {

  @ViewChild(VirtualScrollerComponent) scroll?: VirtualScrollerComponent;
  items: TreeItem[] = [];
  logContent: string[] = [];
  error?: string;

  private _query: string = "";
  private logFiles: any[] = [];
  private decoder = new TextDecoder("utf-8");
  private logBuffer = "";
  private abortController?: AbortController;
  private currIdx = -1;

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute, private sanitizer: DomSanitizer) {
    super();
  }

  ngOnInit(): void {
    this.loadLogFiles();
    this.addSub(this.route.paramMap.subscribe(map => {
      let id = map.get("id");
      if (id) {
        this.loadLogFile(id);
      } else {
        this.logContent = [];
      }
      this.rebuildList();
    }))
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.abortController?.abort();
  }

  async loadLogFiles() {
    this.logFiles = await this.api.fetchLogFiles().toPromise()
    this.rebuildList();
  }

  private rebuildList() {
    let id = this.route.snapshot.paramMap.get("id");
    this.items = this.logFiles.map(file => {
      return {
        title: file.name,
        value: file.id,
        selected: file.id == id
      }
    })
  }

  async loadLogFile(id: string | number) {
    this.error = undefined;
    try {
      let file = await this.api.fetchLogFile(id).toPromise();
      await this.loadContents(file.content);
    } catch {
      this.error = "Error loading file."
    }
  }

  handleSelection(id: number) {
    this.router.navigate(['logs', id.toString()]);
  }

  get selectedId() {
    return this.route.snapshot.paramMap.get("id");
  }

  async loadContents(link: string) {
    this.abortController?.abort();

    this.abortController = new AbortController();
    this.logContent = [];

    let resp = await fetch(link, { signal: this.abortController.signal });
    if (!resp.ok)
      throw resp.statusText
    let reader = resp.body?.getReader();
    if (reader)
      this.loadNextChunk(reader);
  }

  async loadNextChunk(reader: ReadableStreamDefaultReader<Uint8Array>) {
    reader.read().then(({ done, value }) => {
      if (!done) {
        let text = this.decoder.decode(value);
        this.logBuffer += text;
        let idx = this.logBuffer.lastIndexOf("\n");
        if (idx >= 0) {
          let lines = this.logBuffer.substring(0, idx);
          this.logBuffer = this.logBuffer.substring(idx);
          this.logContent = this.logContent.concat(lines.split("\n"));
        }
        this.loadNextChunk(reader);
      }
    })
  }

  set query(q: string) {
    let reset = q != this._query;
    this._query = q;
    this.search(q, reset);
  }

  get query() {
    return this._query;
  }

  search(query: string, reset: boolean) {
    let re = new RegExp("(" + query + ")", 'gi')
    this.currIdx = reset ? 0 : this.currIdx;
    const index = this.logContent.slice(this.currIdx + 1).findIndex(v => re.test(v));
    console.log(index);
    this.currIdx = index === -1 ? 0 : (this.currIdx + index + 1);
    if (this.currIdx >= 0 && query != "") {
      this.scroll?.scrollToIndex(this.currIdx);
    }
  }

  highlight(text: string, q: string) {
    let replacement = q !== "" ? "<span style='background-color: yellow'>$1</span>" : "$1";
    let re = new RegExp("(" + q + ")", 'gi')
    return this.sanitizer.bypassSecurityTrustHtml(text.replace(re, replacement));
  }


}
