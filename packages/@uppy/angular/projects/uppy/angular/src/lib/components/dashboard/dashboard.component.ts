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
	selector: "uppy-dashboard",
	template: "",
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
})
export class DashboardComponent<M extends Meta, B extends Body>
	extends UppyAngularWrapper<M, B, DashboardOptions<M, B>>
	implements OnDestroy, OnChanges
{
	el = inject(ElementRef);

	@Input() uppy: Uppy<M, B> = new Uppy();
	@Input() props: DashboardOptions<M, B> = {};

	/** Inserted by Angular inject() migration for backwards compatibility */
	constructor(...args: unknown[]);

	constructor() {
		super();
	}

	ngOnInit() {
		this.onMount(
			{ id: "angular:Dashboard", inline: true, target: this.el.nativeElement },
			Dashboard,
		);
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.handleChanges(changes, Dashboard);
	}

	ngOnDestroy(): void {
		this.uninstall();
	}
}
