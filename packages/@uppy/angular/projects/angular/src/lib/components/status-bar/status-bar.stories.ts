import { StatusBarDemoComponent } from './status-bar-demo.component';
import { moduleMetadata } from '@storybook/angular';
import { UppyAngularStatusBarModule } from './status-bar.module';

export default {
  title: 'Status Bar',
  decorators: [
    moduleMetadata({
      imports: [UppyAngularStatusBarModule],
      declarations: [StatusBarDemoComponent]
    }),
  ]
};

export const Default = () => ({
  component: StatusBarDemoComponent,
});