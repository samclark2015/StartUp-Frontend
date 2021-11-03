import { HttpClient, HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { groupBy } from 'lodash-es';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/api.service';
import { SubscriptionDelegate } from 'src/app/subscription-delegate';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

export interface Event {
  type: number
  timestamp: Date,
  message: string
  user?: string,
  isNew?: boolean,
  task?: any
}

function pairwise(arr: any[], func: (i0: number, a0: any, i1: number, a1: any) => void) {
  for (var i = 0; i < arr.length - 1; i++) {
    func(i, arr[i], i + 1, arr[i + 1])
  }
}


@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  animations: [
    trigger('newItem', [
      state("true", style({
        background: "lightgrey"
      })),
      state("false", style({
        background: "*"
      })),
      transition('1=>0', [
        animate('2.5s')
      ]),
    ]),
  ],
})
export class EventsComponent extends SubscriptionDelegate implements OnInit, OnChanges, AfterViewInit {

  @Input() title?: string;
  @Input() url: string = "";
  @Input() params: any;

  @ViewChild('scroller') scroller?: ElementRef;

  continuousUpdates = true;
  query = "";
  lastUpdate?: Date;
  filteredEvents: Event[] = [];
  mappedEvents: Event[] = [];
  groupedEvents: Event[][] = [];
  loading = false;
  selectedTraceback?: string;

  private moreUrl?: string;
  private socket?: Subscription;
  private _events: Event[] = []


  get events() {
    return this._events;
  }

  set events(events) {
    this._events = events;
    this.updateFilteredData();
  }

  constructor(private http: HttpClient, private api: ApiService, public changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  updateFilteredData() {
    this.mappedEvents = this.events.map((r: any) => {
      if (r.event_type == 4) {
        // traceback
        let idx = r.message.indexOf('\n');
        let [message, traceback] = [r.message.substr(0, idx), r.message.substr(idx + 1)];
        return {
          ...r,
          message,
          traceback
        }
      } else {
        // otherwise
        return r
      }
    });

    let results;
    if (this.query === "") {
      results = this.mappedEvents;
    } else {
      results = this.mappedEvents.filter((event) =>
        event.message.toLowerCase().includes(this.query.toLowerCase())
      );
    }

    // let groups = groupBy(results, 'task');
    let groups = results.reduce<Event[][]>(function(prev, curr) {
      if (prev.length && curr.task === prev[prev.length - 1][0].task) {
          prev[prev.length - 1].push(curr);
      }
      else {
          prev.push([curr]);
      }
      return prev;
  }, []);
    this.filteredEvents = results;
    // this.groupedEvents = Object.values(groups).map(events => events.reverse());
    this.groupedEvents = groups.map(events => events.reverse());
  }

  ngOnInit(): void {
    this.fetchLatest();
  }

  ngAfterViewInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.events = [];
    this.subscribeWS();
    this.fetchLatest();
  }

  eventIcon(type: number) {
    switch (type) {
      case 1:
        return "exclamation-triangle";
      case 2:
        return "bug";
      case 3:
        return "check-circle";
      case 4:
        return "file-code";
      default:
        return null;
    }
  }

  eventClass(type: number) {
    switch (type) {
      case 1:
        return "has-text-warning";
      case 2:
        return "has-text-danger";
      case 3:
        return "has-text-success";
      default:
        return null;
    }
  }

  showTraceback(event: any) {
    this.selectedTraceback = event;
  }

  private async fetchLatest() {
    this.loading = true;
    let params = new HttpParams({ fromObject: this.params });
    let data = await this.http.get<any>(this.url, { params }).toPromise();
    this.events = data.results;
    this.moreUrl = data.next;
    this.lastUpdate = new Date();
    this.loading = false;
  }

  private async fetchOlder() {
    if (!this.moreUrl)
      return;
    let data = await this.http.get<any>(this.moreUrl).toPromise();
    this.events = this.events.concat(data.results);
    this.moreUrl = data.next;
  }

  private subscribeWS() {
    if (this.socket) {
      this.socket.unsubscribe();
      this.socket = undefined;
    }
    if (!this.params.obj) {
      return;
    }
    this.socket = this.api.subscribeWS("events." + this.params.obj).subscribe(async (data: any) => {
      switch (data.type) {
        case "event.add":
          data.data.isNew = true;
          this.events.splice(0, 0, data.data);
          this.updateFilteredData();
          // this.scroller?.nativeElement.scrollTo(0, 0);
          this.lastUpdate = new Date();
          break;
        default:
          break;
      }
    });
    this.addSub(this.socket);
  }

  async handleScroll(event: any) {
    if (!this.moreUrl || this.loading || event.endIndex !== this.events.length - 1) return;
    this.loading = true;
    await this.fetchOlder();
    this.loading = false;
  }
}
