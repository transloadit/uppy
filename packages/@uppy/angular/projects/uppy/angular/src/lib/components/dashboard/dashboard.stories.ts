import { DashboardDemoComponent } from './dashboard-demo.component';
import { moduleMetadata } from '@storybook/angular';

export default {
  title: 'Dashboard',
  decorators: [
    moduleMetadata({
      declarations: [DashboardDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: DashboardDemoComponent,
});
