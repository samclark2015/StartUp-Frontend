import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ConfigService } from './config.service';
import { Notification, NotificationService, NotificationAction } from './notification.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'startup-ng';
  notifications: Notification[] = [];

  constructor(private configService: ConfigService, private notifService: NotificationService, private auth: AuthService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.notifService.channel.subscribe((notif) => {
      this.notifications.push(notif);
    })
  }

  get host() {
    let url = this.configService.apiBase;
    return url.host;
  }

  login() {
    if (environment.useTokenAuth) {
      this.router.navigate(["login", { next: location.pathname }]);
    } else {
      let url = new URL("login/", this.configService.apiBase);
      url.searchParams.set("next", location.href);
      location.href = url.toString();
    }
  }

  logout() {
    if (environment.useTokenAuth) {
      this.auth.doTokenLogout();
    } else {
      let url = new URL("logout/", this.configService.apiBase)
      url.searchParams.set("next", location.href);
      location.href = url.toString();
    }
  }

  username() {
    return this.auth.getUsername();
  }

  isScreenlocked() {
    return this.auth.getScreenlock();
  }

  isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  closeNotification(notif: Notification) {
    let idx = this.notifications.indexOf(notif);
    if (idx < 0)
      return;
    this.notifications.splice(idx, 1);
  }

  handleNotificationAction(notif: Notification, action: NotificationAction) {
    action.callback();
    this.closeNotification(notif);
  }
}
