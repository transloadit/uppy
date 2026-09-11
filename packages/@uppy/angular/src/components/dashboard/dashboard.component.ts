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
import type { Body, Meta, Uppy } from "@uppy/core";
import type { DashboardOptions } from "@uppy/dashboard";
import Dashboard from "@uppy/dashboard";
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

	// Left unset on purpose: the wrapper creates (and destroys) its own instance in
	// `onMount` when nothing is passed in, so we never build one just to throw it away.
	@Input() uppy!: Uppy<M, B>;
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
