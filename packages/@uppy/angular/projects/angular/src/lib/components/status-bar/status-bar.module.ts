import { NgModule } from '@angular/core';
import { StatusBarComponent } from './status-bar.component';

export const COMPONENTS = [StatusBarComponent];
@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class UppyAngularStatusBarModule { }
