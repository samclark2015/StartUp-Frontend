import { Observable, Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';

export class SubscriptionDelegate implements OnDestroy {
    private subscriptions: Subscription[] = [];

    protected subscribe<T>(observable: Observable<T>, callback: (value: T) => void): Subscription {
        const subscription = observable.subscribe(callback);
        this.subscriptions.push(subscription);
        return subscription;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

}
