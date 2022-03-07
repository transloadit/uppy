import { DashboardModalDemoComponent } from './dashboard-modal-demo.component';
import { moduleMetadata } from '@storybook/angular';
import { UppyAngularDashboardModalModule } from './dashboard-modal.module';

export default {
  title: 'Dashboard',
  decorators: [
    moduleMetadata({
      imports: [UppyAngularDashboardModalModule],
      declarations: [DashboardModalDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: DashboardModalDemoComponent,
});
