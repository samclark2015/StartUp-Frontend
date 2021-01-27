import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface TokenAuth {
  token: string
}

const STORAGE_KEY = "token_auth";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token?: string;
  private username?: string;
  private authenticated = false;
  private screenlock = false;

  constructor(private http: HttpClient) {
    let str = localStorage.getItem(STORAGE_KEY);
    if (str) {
      let authData: TokenAuth = JSON.parse(str);
      this.token = authData.token;
      this.authenticated = true;
    }
  }

  async doTokenAuth(username: string, password: string) {
    let body = {
      username,
      password
    }

    let response = await this.http.post<TokenAuth>('../token-auth/', body).toPromise();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
    this.token = response.token;
    this.authenticated = true;
  }


  doTokenLogout() {
    localStorage.removeItem(STORAGE_KEY);
    this.token = undefined;
    this.username = undefined;
    this.authenticated = false;
  }

  setScreenlock(enabled: boolean) {
    this.screenlock = enabled;
  }

  setExternalAuth(yes: boolean) {
    this.authenticated = yes;
  }

  getScreenlock() {
    return this.screenlock;
  }

  getUsername() {
    return this.username;
  }

  setUsername(username?: string) {
    this.username = username;
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    // return this.token != null || this.username != null;
    return this.authenticated;
  }


}
