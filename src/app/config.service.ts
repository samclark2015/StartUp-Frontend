import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor() { }

  get apiBase() {
    return new URL(environment.apiBase, location.href);
  }

  get useTokenAuth() {
    return true;
  }
}
