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
import type { ProgressBarOptions } from "@uppy/progress-bar";
import ProgressBar from "@uppy/progress-bar";
import type { Body, Meta } from "@uppy/utils/lib/UppyFile";
import { UppyAngularWrapper } from "../../utils/wrapper";

@Component({
	selector: "uppy-progress-bar",
	template: "",
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
})
export class ProgressBarComponent<M extends Meta, B extends Body>
	extends UppyAngularWrapper<M, B, ProgressBarOptions>
	implements OnDestroy, OnChanges
{
	el = inject(ElementRef);

	@Input() uppy: Uppy<M, B> = new Uppy();
	@Input() props: ProgressBarOptions = {};

	/** Inserted by Angular inject() migration for backwards compatibility */
	constructor(...args: unknown[]);

	constructor() {
		super();
	}

	ngOnInit() {
		this.onMount(
			{ id: "angular:ProgressBar", target: this.el.nativeElement },
			ProgressBar,
		);
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.handleChanges(changes, ProgressBar);
	}

	ngOnDestroy(): void {
		this.uninstall();
	}
}
