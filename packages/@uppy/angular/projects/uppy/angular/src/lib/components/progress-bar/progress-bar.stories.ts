import { moduleMetadata } from '@storybook/angular';
import { ProgressBarDemoComponent } from './progress-bar-demo.component';
import { CommonModule } from '@angular/common';

export default {
  title: 'Progress Bar',
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
      declarations: [ProgressBarDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: ProgressBarDemoComponent,
});
