import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { catchError, tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import Cookies from "js-cookie";

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(private configService: ConfigService, private auth: AuthService, private notif: NotificationService, private router: Router) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.indexOf('://') < 0 && request.url.indexOf('//') < 0) {
      // URL is relative; either "http://example.com" or "//example.com"
      let base = new URL("api/", this.configService.apiBase);
      let url = new URL(request.url, base).toString();
      request = request.clone({ url });
    }

    if (environment.useTokenAuth && this.auth.isAuthenticated()) {
      let token = this.auth.getToken();
      var headers = request.headers.set("Authorization", `Token ${token}`);
      request = request.clone({ headers });
    }

    let xsrf = Cookies.get('csrftoken');
    if (xsrf) {
      var headers = request.headers.set("X-CSRFToken", xsrf);
      request = request.clone({ headers });
    }


    return next.handle(request).pipe(tap(evt => {
      if (evt instanceof HttpResponse) {
        let user = evt.headers.get("cad-user");
        let screenlockUser = evt.headers.get("cad-screenlock-user");

        this.auth.setUsername(user || screenlockUser || undefined);
        this.auth.setScreenlock(user == null && screenlockUser != null);
        this.auth.setExternalAuth(user != null || screenlockUser != null);
      }
    }), catchError((evt: any) => {
      if (evt instanceof HttpErrorResponse) {
        if (evt.status == 401) {
          if (environment.useTokenAuth)
            this.auth.doTokenLogout();
          this.notif.notify({
            title: "Authentication Required", class: "is-warning", actions: [{
              title: "Login",
              callback: () => this.router.navigate(["login", { next: location.pathname }])
            }]
          });
        }
      }
      throw evt;
    }));
  }
}
