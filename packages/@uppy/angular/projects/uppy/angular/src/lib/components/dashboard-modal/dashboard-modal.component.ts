import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Input,
	inject,
	type OnChanges,
	type OnDestroy,
	type SimpleChanges,
} from "@angular/core";
import { Uppy } from "@uppy/core";
import type { DashboardOptions } from "@uppy/dashboard";
import Dashboard from "@uppy/dashboard";
import type { Body, Meta } from "@uppy/utils";
import { UppyAngularWrapper } from "../../utils/wrapper";

@Component({
	selector: "uppy-dashboard-modal",
	template: "",
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
})
export class DashboardModalComponent<M extends Meta, B extends Body>
	extends UppyAngularWrapper<M, B, DashboardOptions<M, B>, Dashboard<M, B>>
	implements OnDestroy, OnChanges
{
	el = inject(ElementRef);

	@Input() uppy: Uppy<M, B> = new Uppy();
	@Input() props: DashboardOptions<M, B> = {};
	@Input() open: boolean = false;

	/** Inserted by Angular inject() migration for backwards compatibility */
	constructor(...args: unknown[]);

	constructor() {
		super();
	}

	ngOnInit() {
		this.onMount(
			{
				id: "angular:DashboardModal",
				inline: false,
				target: this.el.nativeElement,
			},
			Dashboard,
		);
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.handleChanges(changes, Dashboard);
		// Handle dashboard-modal specific changes
		if (changes["open"] && this.open !== changes["open"].previousValue) {
			if (this.open && !changes["open"].previousValue) {
				this.plugin!.openModal();
			}
			if (!this.open && changes["open"].previousValue) {
				this.plugin!.closeModal();
			}
		}
	}

	ngOnDestroy(): void {
		this.uninstall();
	}
}
