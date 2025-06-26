import { createDropzone, type DropzoneOptions } from "@uppy/components";
import { getContext } from "svelte";

import { getUppyContext } from "./components/headless/uppyContext.js";

export type SvelteDropzoneReturn = {
	getRootProps: () => {
		ondragenter: (event: DragEvent) => void;
		ondragover: (event: DragEvent) => void;
		ondragleave: (event: DragEvent) => void;
		ondrop: (event: DragEvent) => void;
		onclick: () => void;
	};
	getInputProps: () => {
		id: string;
		type: "file";
		multiple: boolean;
		onchange: (event: Event) => void;
	};
};

export function useDropzone(options?: DropzoneOptions): SvelteDropzoneReturn {
	const ctx = getUppyContext();
	const dropzone = createDropzone(ctx, options);

	return {
		// Only Svelte uses lowercase event names so we want to remap them
		...dropzone,
		getRootProps: () => {
			const { onDragEnter, onDragOver, onDragLeave, onDrop, onClick, ...rest } =
				dropzone.getRootProps();
			return {
				...rest,
				ondragenter: onDragEnter,
				ondragover: onDragOver,
				ondragleave: onDragLeave,
				ondrop: onDrop,
				onclick: onClick,
			};
		},
		getInputProps: () => {
			const { onChange, ...rest } = dropzone.getInputProps();
			return {
				...rest,
				onchange: onChange,
			};
		},
	};
}
