import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeItem, TreeViewComponent } from 'src/app/components/tree-view/tree-view.component';
import { ApiService, DashboardView } from '../api.service';
import { SubscriptionDelegate } from '../subscription-delegate';
import details from './details.json';
import { merge, Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import {
  trigger,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-server-index',
  templateUrl: './server-index.component.html',
  styleUrls: ['./server-index.component.scss'],
  animations: [
    trigger('openClose', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('100ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0 }))
      ]),
    ]),
  ],
})
export class ServerIndexComponent extends SubscriptionDelegate implements OnInit {

  @ViewChild("serverTreeComponent") private serverTreeComponent?: TreeViewComponent;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router, private auth: AuthService) {
    super();
  }

  dashboard?: DashboardView;

  serverTree: TreeItem[] = [];
  categoryTree: TreeItem[] = [];
  selectedServer?: any;
  selectedCategory?: any;
  details: any[] = [];

  detailCollapse = true;
  eventCollapse = false;

  actionPending = false;

  private servers: any[] = [];
  private _selectedServerId?: number;
  private query?: string;
  private socket?: Subscription;

  get selectedServerId(): number | undefined {
    return this._selectedServerId;
  }

  set selectedServerId(id: number | undefined) {
    this._selectedServerId = id;
    this.selectedServer = undefined;
    this.actionPending = false;
    this.rebuildServerTree();
    this.socket?.unsubscribe();
    if (id) {
      // this.serverTreeComponent?.scrollToItemWithValue(id);
      this.api.fetchServer(id).subscribe((server) => {
        this.selectedServer = server;
        this.details = details.filter(detail => this.selectedServer[detail.field]).map(detail => {
          return {
            title: detail.title,
            value: this.selectedServer[detail.field]
          }
        });
        this.actionPending = server.current_job != null;
        this.socket = merge(
          this.api.subscribeWS("servers." + id),
          this.api.subscribeWS("sysmon." + server.name),
        ).subscribe(message => {
          switch (message.type) {
            case "job.complete":
              this.actionPending = false;
              break;
            case "sysmon.update":
              this.selectedServer.sysmon_status = message.data;
              break;
            default:
              break
          }
        });
      });

    } else {
      this.fetchDashboard();
    }
  }


  ngOnInit(): void {
    this.fetchServers();
    this.addSub(this.route.paramMap.subscribe((map) => {
      let id = map.get("id");
      if (id) {
        this.selectedServerId = parseInt(id);
      } else {
        this.selectedServerId = undefined;
      }
    }));
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.socket?.unsubscribe();
  }

  private fetchDashboard() {
    this.api.fetchDashboard().subscribe((dash) => this.dashboard = dash);
  }

  private fetchServers() {
    this.api.fetchServers(this.query, this.selectedCategory).subscribe(this.handleServers.bind(this));

  }

  private handleServers(data: any[]) {
    this.servers = data;
    this.rebuildServerTree();
    this.rebuildCategoryTree();
  }

  private rebuildServerTree() {
    this.serverTree = this.servers.map((server) => {
      return {
        title: server.name,
        subtitle: server.console_file_path,
        value: server.id,
        collapsed: false,
        selected: server.id == this.selectedServerId
      };
    });
    // if(this.selectedServerId != null) {
    // this.serverTreeComponent?.scrollToItemWithValue(this._selectedServerId);
    // }
  }

  private async rebuildCategoryTree() {
    let data = await this.api.fetchCategories().toPromise();

    let categories: TreeItem[] = [];
    data.forEach((category: any) => {
      var tree = categories;
      category.tree.forEach((dir: string, idx: number) => {
        var ent = tree.find(ent => ent.title == dir);
        if (ent == null) {
          let value = category.tree.slice(0, idx + 1).join("/");
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


  handleSearch(q: string) {
    this.query = q;
    this.fetchServers();
  }

  handleSelect(id: number) {
    this.router.navigate(["servers", id]);
  }

  handleCategorySelect(value: string) {
    this.selectedCategory = value;
    this.rebuildCategoryTree();
    this.fetchServers();
  }

  async handleAction(action: any) {
    if (!this.selectedServerId)
      return
    this.actionPending = true;
    try {
      await this.api.performAction(this.selectedServerId, action.method).toPromise();
    } catch {
      this.actionPending = false;
    }
  }

  getSysMonName(name: string) {
    return name == "No Longer Watched"
      ? name
      : `Monitored by ${name}`
  }

  get jsonData() {
    return JSON.stringify(this.selectedServer, null, 2);
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }
}
