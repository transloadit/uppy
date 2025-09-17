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
import type { StatusBarOptions } from "@uppy/status-bar";
import StatusBar from "@uppy/status-bar";
import type { Body, Meta } from "@uppy/utils";
import { UppyAngularWrapper } from "../../utils/wrapper";

@Component({
	selector: "uppy-status-bar",
	template: "",
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
})
export class StatusBarComponent<M extends Meta, B extends Body>
	extends UppyAngularWrapper<M, B, StatusBarOptions>
	implements OnDestroy, OnChanges
{
	el = inject(ElementRef);

	@Input() uppy: Uppy<M, B> = new Uppy();
	@Input() props: StatusBarOptions = {};

	/** Inserted by Angular inject() migration for backwards compatibility */
	constructor(...args: unknown[]);

	constructor() {
		super();
	}

	ngOnInit() {
		this.onMount(
			{ id: "angular:StatusBar", target: this.el.nativeElement },
			StatusBar,
		);
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.handleChanges(changes, StatusBar);
	}

	ngOnDestroy(): void {
		this.uninstall();
	}
}
