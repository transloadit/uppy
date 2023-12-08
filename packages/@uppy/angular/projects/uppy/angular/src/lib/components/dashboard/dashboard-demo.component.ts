import { Component, ChangeDetectionStrategy } from '@angular/core';
// @ts-expect-error
import * as Dashboard from '@uppy/dashboard';
// @ts-expect-error
import { Uppy } from '@uppy/core';

@Component({
  selector: 'uppy-dashboard-demo',
  template: `<uppy-dashboard [uppy]="uppy" [props]="props"></uppy-dashboard>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardDemoComponent {
  uppy: Uppy = new Uppy({ debug: true, autoProceed: true });
  props: Dashboard.DashboardOptions;
}
