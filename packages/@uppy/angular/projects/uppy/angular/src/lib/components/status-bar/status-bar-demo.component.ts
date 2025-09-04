import { ChangeDetectionStrategy, Component, type OnInit } from "@angular/core";
import { Uppy } from "@uppy/core";
import type * as StatusBar from "@uppy/status-bar";
import Tus from "@uppy/tus";
import type { Body, Meta } from "@uppy/utils/lib/UppyFile";
import { StatusBarComponent } from "./status-bar.component";

@Component({
	selector: "uppy-status-bar-demo",
	template: `
    <div class="UppyInput"></div>
    <uppy-status-bar [uppy]="uppy" [props]="props"></uppy-status-bar>
  `,
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [StatusBarComponent],
})
export class StatusBarDemoComponent<M extends Meta, B extends Body>
	implements OnInit
{
	uppy: Uppy<M, B> = new Uppy({ debug: true, autoProceed: true });
	props: StatusBar.StatusBarOptions = {
		hideUploadButton: true,
		hideAfterFinish: false,
	};

	ngOnInit(): void {
		this.uppy
			.use(Tus, { endpoint: "https://master.tus.io/files/" });
	}
}
