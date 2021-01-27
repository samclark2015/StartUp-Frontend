import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor() { }

  get host() {
    return environment.host;
  }

  get useTokenAuth() {
    return true;
  }
}
