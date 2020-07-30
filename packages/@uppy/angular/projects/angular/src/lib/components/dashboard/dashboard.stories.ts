import { DashboardDemoComponent } from './dashboard-demo.component';
import { moduleMetadata } from '@storybook/angular';
import { UppyAngularDashboardModule} from './dashboard.module';

export default {
  title: 'Dashboard',
  decorators: [
    moduleMetadata({
      imports: [UppyAngularDashboardModule],
      declarations: [DashboardDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: DashboardDemoComponent,
});