import { Component, ChangeDetectionStrategy } from '@angular/core';
import * as Dashboard from '@uppy/dashboard';
import { Uppy } from '@uppy/core';

@Component({
  selector: 'uppy-dashboard-demo',
  template: `<uppy-dashboard-modal [uppy]='uppy' [props]='props'></uppy-dashboard-modal>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardModalDemoComponent {
  uppy: Uppy = new Uppy({ debug: true, autoProceed: true });
  props: Dashboard.DashboardOptions;
}
