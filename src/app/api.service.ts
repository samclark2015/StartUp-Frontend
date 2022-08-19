import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import _ from 'lodash';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ConfigService } from './config.service';
import { DashboardView } from './models';

const CHANNEL_RE = /[^a-zA-Z0-9\-\.]/g;

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private wsSubject: WebSocketSubject<any>;

  constructor(private http: HttpClient, configService: ConfigService) {
    let url = configService.host.replace("http", "ws");
    this.wsSubject = webSocket(url + "ws/");
  }

  fetchServers(q?: string, category?: string) {
    var params = new HttpParams()
      .set("all", "true");
    if (q)
      params = params.set("name", q);
    if (category)
      params = params.set("category", category);
    return this.http.get<any[]>("servers/", { params });
  }

  fetchServer(id: string | number) {
    return this.http.get<any>(`servers/${id}/`);
  }

  fetchCategories() {
    return this.http.get<any>("categories/");
  }

  fetchDashboard() {
    return this.http.get<DashboardView>("servers/dashboard/");
  }

  fetchLogFiles() {
    return this.http.get<any[]>("logfiles/");
  }

  fetchLogFile(id: string | number) {
    return this.http.get<any>(`logfiles/${id}/`);
  }

  fetchMasterLog() {
    return this.http.get<any[]>("logfiles/master/");
  }

  performAction(id: string | number, method: string) {
    let body = {
      method
    }
    return this.http.post<any>(`servers/${id}/action/`, body);
  }

  subscribeWS(channel: string, criteria: any = undefined) {
    channel = channel.replace(CHANNEL_RE, "-");
    const obs = this.wsSubject.multiplex(
      () => ({
        type: "subscribe",
        data: channel,
      }),
      () => ({
        type: "unsubscribe",
        data: channel,
      }),
      (data) => {
        if(criteria == null) return true;
        return _.isMatch(data.data, criteria);
      }
    );

    return obs;
  }
}
