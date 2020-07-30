import { NgModule } from '@angular/core';
import { DashboardComponent } from './dashboard.component';

export const COMPONENTS = [DashboardComponent];
@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class UppyAngularDashboardModule { }
