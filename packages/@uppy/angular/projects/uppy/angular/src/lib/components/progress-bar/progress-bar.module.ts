import { NgModule } from '@angular/core';
import { ProgressBarComponent } from './progress-bar.component';

export const COMPONENTS = [ProgressBarComponent];
@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class UppyAngularProgressBarModule { }
