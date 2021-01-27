import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface NotificationAction {
  title: string;
  callback: () => any;
}
export interface Notification {
  title: string;
  body?: string;
  actions?: NotificationAction[];
  class?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private _subject: Subject<Notification> = new Subject();

  constructor() { }

  notify(notif: Notification) {
    this._subject.next(notif);
  }

  get channel() {
    return this._subject;
  }
}
