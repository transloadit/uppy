import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Uppy } from "@uppy/core";
import type * as Dashboard from "@uppy/dashboard";
import type { Body, Meta } from "@uppy/core";
import { DashboardModalComponent } from "./dashboard-modal.component";


@Component({
	selector: "uppy-dashboard-demo",
	template: `<uppy-dashboard-modal
    [uppy]="uppy"
    [props]="props"
  ></uppy-dashboard-modal>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [DashboardModalComponent],
})
export class DashboardModalDemoComponent<M extends Meta, B extends Body> {
	uppy: Uppy<M, B> = new Uppy({ debug: true, autoProceed: true });
	props: Dashboard.DashboardOptions<M, B> = {};
}
