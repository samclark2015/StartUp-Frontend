import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiInterceptor } from './api.interceptor';
import { LoginComponent } from './login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServerIndexComponent } from './server-index/server-index.component';
import { ComponentsModule } from './components/components.module';
import { LogfileIndexComponent } from './logfile-index/logfile-index.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { BackendUrlPipe } from './backend-url.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MasterLogComponent } from './master-log/master-log.component';

import { DatetimerangepickerModule } from "angular-datetimerangepicker";
import { HighlightPipe } from './highlight.pipe';
import { SearchComponent } from './components/search/search.component';

@NgModule({
  declarations: [
    AppComponent,
    ServerIndexComponent,
    LoginComponent,
    LogfileIndexComponent,
    BackendUrlPipe,
    MasterLogComponent,
    HighlightPipe,
    SearchComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    HttpClientModule,
    ReactiveFormsModule,
    ComponentsModule,
    VirtualScrollerModule,
    BrowserAnimationsModule,
    FormsModule,
    DatetimerangepickerModule
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: ApiInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }
}
