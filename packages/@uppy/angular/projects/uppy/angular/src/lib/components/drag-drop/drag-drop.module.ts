import { NgModule } from '@angular/core';
import { DragDropComponent } from './drag-drop.component';

export const COMPONENTS = [DragDropComponent];
@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class UppyAngularDragDropModule { }
