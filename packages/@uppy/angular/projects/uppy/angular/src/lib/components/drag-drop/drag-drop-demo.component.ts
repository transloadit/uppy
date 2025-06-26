import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Uppy } from "@uppy/core";
import type * as DragDrop from "@uppy/drag-drop";
import type { Body, Meta } from "@uppy/utils/lib/UppyFile";

@Component({
	selector: "uppy-drag-drop-demo",
	template: ` <uppy-drag-drop [uppy]="uppy" [props]="props"></uppy-drag-drop> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragDropDemoComponent<M extends Meta, B extends Body> {
	uppy: Uppy<M, B> = new Uppy({ debug: true, autoProceed: true });
	props: DragDrop.DragDropOptions = {};
}
