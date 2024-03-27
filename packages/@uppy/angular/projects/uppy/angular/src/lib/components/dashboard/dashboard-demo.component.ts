import { Component, ChangeDetectionStrategy } from '@angular/core';
import * as Dashboard from '@uppy/dashboard';
import { Uppy } from '@uppy/core';
import { Body, Meta } from '@uppy/utils/lib/UppyFile';

@Component({
  selector: 'uppy-dashboard-demo',
  template: `<uppy-dashboard [uppy]="uppy" [props]="props"></uppy-dashboard>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardDemoComponent<M extends Meta, B extends Body> {
  uppy: Uppy<M, B> = new Uppy({ debug: true, autoProceed: true });
  props?: Dashboard.DashboardOptions<M, B>;
}
