import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterDetailComponent } from './master-detail/master-detail.component';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { ScrollingModule } from "@angular/cdk/scrolling";
import { EventsComponent } from './events/events.component';
import { FormsModule } from '@angular/forms'; // <--- JavaScript import from Angular
import { MomentModule } from 'ngx-moment';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { UiScrollModule } from 'ngx-ui-scroll';

@NgModule({
  declarations: [MasterDetailComponent, TreeViewComponent, EventsComponent],
  exports: [MasterDetailComponent, TreeViewComponent, EventsComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    ScrollingModule,
    FormsModule,
    MomentModule,
    VirtualScrollerModule,
    UiScrollModule
  ]
})
export class ComponentsModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }
}
