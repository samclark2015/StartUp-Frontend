import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeItem, TreeViewComponent } from 'src/app/components/tree-view/tree-view.component';
import { ApiService } from '../api.service';
import { DashboardView, Server } from "../models";
import { SubscriptionDelegate } from '../subscription-delegate';
import details from './details.json';
import { forkJoin, merge, Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import {
  trigger,
  style,
  animate,
  transition,
} from '@angular/animations';
import _ from 'lodash';

@Component({
  selector: 'app-server-index',
  templateUrl: './server-index.component.html',
  styleUrls: ['./server-index.component.scss'],
  animations: [
    trigger('openClose', [
      transition(':enter', [
        style({ transform: "scale(0)", transformOrigin: "top left" }),
        animate('150ms ease-out', style({ transform: "scale(1)" }))
      ]),
      transition(':leave', [
        style({ transform: "scale(1)", transformOrigin: "top left" }),
        animate('150ms ease-in', style({ transform: "scale(0)" }))
      ]),
    ]),
  ],
})
export class ServerIndexComponent extends SubscriptionDelegate implements OnInit {

  @ViewChild("serverTreeComponent") private serverTreeComponent?: TreeViewComponent;

  // Dashboard info
  dashboard?: DashboardView;

  // Tree items
  serverTree: TreeItem[] = [];
  categoryTree: TreeItem[] = [];

  // Component state
  availableActions: any[] = [];
  selectedServersId: string[] = [];
  selectedServers?: Server[];
  selectedCategory?: any;
  detailCollapse = true;
  eventCollapse = false;
  actionPending = false;
  query?: string;

  private servers: any[] = [];
  private rawCategories: any[] = [];
  private socket?: Subscription;
  private currentRequest?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router, private auth: AuthService) {
    super();
  }

  ngOnInit(): void {
    this.query = this.route.snapshot.queryParams["q"];

    this.api.fetchCategories().toPromise().then(data => {
      this.rawCategories = data;
      this.rebuildCategoryTree();
    });

    this.fetchServers();
    this.subscribe(this.route.queryParamMap, params => {
      const path = params.get("path");
      if (path != this.selectedCategory) {
        this.selectedCategory = path;
        this.rebuildCategoryTree();
        this.fetchServers();
      }

      let ids = params.getAll("id");
      if (ids.length == 0 || !_.isEqual(ids, this.selectedServersId)) {
        this.selectedServersId = ids;

        this.selectedServers = undefined;
        this.dashboard = undefined;
        this.actionPending = false;
        this.rebuildServerTree();

        this.socket?.unsubscribe();
        this.currentRequest?.unsubscribe();

        if (ids.length == 1) {
          let id = ids[0];
          this.currentRequest = this.api.fetchServer(id).subscribe((server) => {
            this.selectedServers = [{
              ...server,
              details: details.filter(detail => server[detail.field]).map(detail => {
                return {
                  title: detail.title,
                  value: server[detail.field]
                }
              })
            }];
            this.availableActions = this.selectedServers[0].actions;
            this.actionPending = server.current_job != null;
            this.socket = merge(
              this.api.subscribeWS(`servers.${id}`),
              this.api.subscribeWS(`sysmon.${server.name}`),
            ).subscribe(message => {
              switch (message.type) {
                case "job.complete":
                  this.actionPending = false;
                  break;
                case "sysmon.update":
                  if (this.selectedServers) this.selectedServers[0].sysmon_status = message.data;
                  break;
                default:
                  break
              }
            });
          });
        } else if (ids.length > 1) {
          this.currentRequest = forkJoin(ids.map(id => this.api.fetchServer(id))).subscribe(servers => {
            this.selectedServers = servers;
            this.availableActions = _.intersectionBy(...this.selectedServers.map(s => s.actions), "method");
          })
        } else {
          this.fetchDashboard();
        }
      }
    });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.socket?.unsubscribe();
  }

  handleSearch(q: string) {
    this.query = q;
    this.router.navigate([], { queryParams: { "q": q }, queryParamsHandling: "merge", skipLocationChange: true });
    this.fetchServers();
  }

  handleSelect(data: [string, boolean]) {
    let [id, multiselect] = data;
    let ids;
    if (multiselect) {
      if (Array.isArray(id)) {
        ids = id;
      } else {
        let idx = this.selectedServersId.indexOf(id.toString());

        if (idx < 0) {
          ids = this.selectedServersId.concat([id.toString()]);
        } else {
          // this.selectedServersId.splice(idx, 1);
          ids = this.selectedServersId.slice();
          ids.splice(idx, 1);
        }
      }
    } else {
      ids = [id];
    }
    this.router.navigate(["servers"], { queryParams: { id: ids }, queryParamsHandling: "merge" });
  }

  handleCategorySelect(data: [string, boolean]) {
    let [value, multiselect] = data;

    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { path: value },
        queryParamsHandling: 'merge', // remove to replace all query params by provided
      });
  }

  getSysMonName(name: string) {
    return name == "No Longer Watched"
      ? name
      : `Monitored by ${name}`
  }

  async handleAction(action: any) {
    if (this.selectedServer) {
      this.actionPending = true;
      try {
        await this.api.performAction(this.selectedServer?.id, action.method).toPromise();
      } finally {
        this.actionPending = false;
      }
    } else if (this.selectedServersId.length > 1) {
      this.actionPending = true;
      try {
        await Promise.all(this.selectedServersId.map(id => this.api.performAction(id, action.method).toPromise()));
      } finally {
        this.actionPending = false;
      }
    }
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  get selectedServer() {
    if (this.selectedServers == null || this.selectedServers.length > 1) {
      return undefined;
    }
    return this.selectedServers[0];
  }


  private fetchDashboard() {
    this.api.fetchDashboard().subscribe((dash) => this.dashboard = dash);
  }

  private fetchServers() {
    this.api.fetchServers(this.query, this.selectedCategory).subscribe(data => {
      this.servers = data;
      this.rebuildServerTree();
    });

  }

  private rebuildServerTree() {
    this.serverTree = this.servers.map((server) => {
      return {
        title: server.name,
        subtitle: server.console_file_path,
        value: server.id,
        collapsed: false,
        selected: this.selectedServersId.includes(server.id.toString())
      };
    });
  }

  private rebuildCategoryTree() {
    let categories: TreeItem[] = [];
    this.rawCategories.forEach((category: any) => {
      var tree = categories;
      category.tree.forEach((dir: string, idx: number) => {
        var ent = tree.find(ent => ent.title == dir);
        if (ent == null) {
          let value = category.tree.slice(0, idx + 1).join("/");
          if (value == "global") value = null;

          ent = {
            title: dir,
            selected: value == this.selectedCategory,
            value: value,
            children: []
          }
          tree.push(ent);
        }
        tree = ent.children || [];
      });
    });
    this.categoryTree = categories;
  }

}
