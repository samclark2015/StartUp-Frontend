import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ConfigService } from './config.service';

const CHANNEL_RE = /[^a-zA-Z0-9\-\.]/g;

export interface DashboardItem {
  "name": string;
  "console_file_path": string;
  "url": string;
  "id": number;
}
export interface DashboardView {
  "bad_servers": DashboardItem[];
}

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

  fetchServer(id: number) {
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

  performAction(id: number, method: string) {
    let body = {
      method
    }
    return this.http.post<any>(`servers/${id}/action/`, body);
  }

  subscribeWS(channel: string) {
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
      () => true
    );

    return obs;
  }
}
