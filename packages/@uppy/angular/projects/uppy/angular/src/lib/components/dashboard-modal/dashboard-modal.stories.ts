import { DashboardModalDemoComponent } from './dashboard-modal-demo.component';
import { moduleMetadata } from '@storybook/angular';

export default {
  title: 'Dashboard',
  decorators: [
    moduleMetadata({
      declarations: [DashboardModalDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: DashboardModalDemoComponent,
});
