import { HttpClient, HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription, merge, concat } from 'rxjs';
import { ApiService } from 'src/app/api.service';
import { SubscriptionDelegate } from 'src/app/subscription-delegate';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import _ from 'lodash';

export interface Event {
  event_type: number
  timestamp: Date,
  message: string
  user?: string,
  isNew?: boolean,
  task?: any
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
  selectedTraceback?: any;

  private moreUrl?: string;
  private socket?: Subscription;
  private _events: Event[] = []


  get events() {
    return this._events;
  }

  set events(events) {
    this._events = events.map(event => {
      return {
        ...event,
        timestamp: new Date(event.timestamp)
      }
    });
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

    let groups = results.reduce<Event[][]>(function (groups, curr) {
      let reordered = false;
      for (let [idx, group] of groups.entries()) {
        if (group.length > 0 &&
          ((curr.task != null && curr.task == group[0].task) ||
            (
              curr.task == null && ((curr as any).obj_name == (group as any)[0].obj_name &&
                Math.abs(curr.timestamp.getTime() - group[0].timestamp.getTime()) < 60_000)
            ))) {
          let new_group = groups.splice(idx, 1)[0];
          new_group.push(curr);
          groups.push(new_group);
          reordered = true;
          break;
        }
      }
      if (!reordered) {
        groups.push([curr]);
      }
      return groups;
    }, []);
    this.filteredEvents = results;
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

  successString(type: number) {
    switch (type) {
      case 1:
      case 2:
        return "Failed";
      case 3:
        return "Successful";
      default:
        return "Ongoing";
    }
  }

  actionName(action: string) {
    switch (action) {
      case "start_action":
        return "start";
      case "stop_action":
        return "stop";
      case "check_action":
        return "check";
      default:
        return "action";
    }
  }

  showTraceback(event: any) {
    this.selectedTraceback = event;
  }

  getGroupUser(group: Event[]) {
    let result = _.find(group, e => e.user != null);
    return result?.user;
  }

  private async fetchLatest() {
    if (Array.isArray(this.params.obj)) {
      return;
    }

    this.loading = true;
    let params = new HttpParams({ fromObject: this.params });
    let data = await this.http.get<any>(this.url, { params }).toPromise();
    this.events = data.results;
    this.moreUrl = data.next;
    this.lastUpdate = new Date();
    this.loading = false;
  }

  private async fetchOlder() {
    if (Array.isArray(this.params.obj)) {
      return;
    }

    if (!this.moreUrl)
      return;
    let data = await this.http.get<any>(this.moreUrl).toPromise();
    this.events = this.events.concat(data.results);
    this.moreUrl = data.next;
  }

  private async subscribeWS() {
    if (this.socket) {
      this.socket.unsubscribe();
      this.socket = undefined;
    }

    if (this.params.obj) {
      let obs;
      if (Array.isArray(this.params.obj)) {
        let details = await Promise.all(this.params.obj.map((id: string) => this.api.fetchServer(id).toPromise()));
        obs = merge(...details.map((server: any) => this.api.subscribeWS(
          "events." + server.id,
          {
            "obj_name": server.name,
            "obj_type": server.type,
            "obj_console_file_path": server.console_file_path
          })));
      } else {
        obs = this.api.subscribeWS("StartUp.events." + this.params.obj);
      }
      this.socket = this.subscribe(obs, async (data: any) => {
        switch (data.type) {
          case "event.add":
            data.data.isNew = true;
            data.data.timestamp = new Date(data.data.timestamp);
            this.events.splice(0, 0, data.data);
            this.updateFilteredData();
            this.lastUpdate = new Date();
            break;
          default:
            break;
        }
      });
    }
  }

  async handleScroll(event: any) {
    if (!this.moreUrl || this.loading || event.endIndex !== this.events.length - 1) return;
    this.loading = true;
    await this.fetchOlder();
    this.loading = false;
  }
}
