import { NgModule } from '@angular/core';
import { DashboardModalComponent } from './dashboard-modal.component';

export const COMPONENTS = [DashboardModalComponent];
@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class UppyAngularDashboardModalModule { }
