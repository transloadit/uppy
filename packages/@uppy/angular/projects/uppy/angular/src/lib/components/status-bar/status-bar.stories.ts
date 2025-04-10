import { StatusBarDemoComponent } from './status-bar-demo.component';
import { moduleMetadata } from '@storybook/angular';

export default {
  title: 'Status Bar',
  decorators: [
    moduleMetadata({
      declarations: [StatusBarDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: StatusBarDemoComponent,
});
