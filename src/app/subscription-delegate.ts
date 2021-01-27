import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';

export class SubscriptionDelegate implements OnDestroy {
    private subscriptions: Subscription[] = [];

    protected addSub(subscription: Subscription) {
        this.subscriptions.push(subscription);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

}
