import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Uppy } from "@uppy/core";
import type * as Dashboard from "@uppy/dashboard";
import type { Body, Meta } from "@uppy/core";
import { DashboardComponent } from "./dashboard.component";

@Component({
	selector: "uppy-dashboard-demo",
	template: `<uppy-dashboard [uppy]="uppy" [props]="props"></uppy-dashboard>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [DashboardComponent],
})
export class DashboardDemoComponent<M extends Meta, B extends Body> {
	uppy: Uppy<M, B> = new Uppy({ debug: true, autoProceed: true });
	props: Dashboard.DashboardOptions<M, B> = {};
}
