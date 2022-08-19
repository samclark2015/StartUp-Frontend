import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LogfileIndexComponent } from './logfile-index/logfile-index.component';
import { LoginComponent } from './login/login.component';
import { MasterLogComponent } from './master-log/master-log.component';
import { ServerIndexComponent } from './server-index/server-index.component';

const routes: Routes = [
  {
    path: "",
    redirectTo: "servers",
    pathMatch: "full"
  },
  {
    path: "logs",
    redirectTo: "logs/",
    pathMatch: "full"
  },
  {
    path: "logs/master",
    component: MasterLogComponent
  },
  {
    path: "servers",
    component: ServerIndexComponent
  },
  {
    path: "logs/:id",
    component: LogfileIndexComponent
  },
  { path: "login", component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
