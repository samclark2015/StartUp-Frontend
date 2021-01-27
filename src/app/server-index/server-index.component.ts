import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeItem, TreeViewComponent } from 'src/app/components/tree-view/tree-view.component';
import { ApiService, DashboardView } from '../api.service';
import { SubscriptionDelegate } from '../subscription-delegate';
import details from './details.json';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-server-index',
  templateUrl: './server-index.component.html',
  styleUrls: ['./server-index.component.scss']
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
    this.rebuildServerTree();
    this.socket?.unsubscribe();
    if (id) {
      // this.serverTreeComponent?.scrollToItemWithValue(id);
      this.api.fetchServer(id).subscribe((server) => {
        this.selectedServer = server;
      });
      this.addSub(this.api.subscribeWS("servers." + id).subscribe(data => {
        switch (data.type) {
          case "job.complete":
            this.actionPending = false;
            break;
          default:
            break
        }
      }))
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

  get details() {
    return details.filter(detail => this.selectedServer[detail.field]).map(detail => {
      return {
        title: detail.title,
        value: this.selectedServer[detail.field]
      }
    });
  }

  get jsonData() {
    return JSON.stringify(this.selectedServer, null, 2);
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }
}
