import { Component, ChangeDetectionStrategy } from '@angular/core';
import * as Dashboard from '@uppy/dashboard';
import { Uppy } from '@uppy/core';

@Component({
  selector: 'uppy-dashboard-demo',
  template: `<uppy-dashboard [uppy]='uppy' [props]='props'></uppy-dashboard>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardDemoComponent {
  uppy: Uppy = new Uppy({ debug: true, autoProceed: true });
  props: Dashboard.DashboardOptions;
}
