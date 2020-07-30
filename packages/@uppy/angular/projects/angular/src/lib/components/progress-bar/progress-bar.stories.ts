import { moduleMetadata } from '@storybook/angular';
import { UppyAngularProgressBarModule } from './progress-bar.module';
import { ProgressBarDemoComponent } from './progress-bar-demo.component';
import { UppyAngularDragDropModule } from '../drag-drop/drag-drop.module';
import { CommonModule } from '@angular/common';

export default {
  title: 'Progress Bar',
  decorators: [
    moduleMetadata({
      imports: [UppyAngularProgressBarModule, UppyAngularDragDropModule, CommonModule],
      declarations: [ProgressBarDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: ProgressBarDemoComponent,
});