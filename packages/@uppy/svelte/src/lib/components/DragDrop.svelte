<script
  lang="ts"
  generics="M extends import('@uppy/utils/lib/UppyFile').Meta, B extends import('@uppy/utils/lib/UppyFile').Body"
>
import type { Uppy } from "@uppy/core";
import DragDropPlugin, { type DragDropOptions } from "@uppy/drag-drop";
import { onDestroy, onMount } from "svelte";

let container: HTMLElement;
let plugin: DragDropPlugin<M, B>;

export let uppy: Uppy<M, B>;
export let props: DragDropOptions | undefined = {};

const installPlugin = () => {
	const options = {
		id: "svelte:DragDrop",
		...props,
		target: container,
	} satisfies DragDropOptions;

	uppy.use(DragDropPlugin<M, B>, options);
	plugin = uppy.getPlugin(options.id) as DragDropPlugin<M, B>;
};
const uninstallPlugin = (uppyInstance: Uppy<M, B> = uppy) => {
	if (plugin != null) uppyInstance.removePlugin(plugin);
};

onMount(() => installPlugin());

onDestroy(() => uninstallPlugin());
$: {
	const options = {
		id: "svelte:DragDrop",
		...props,
		target: container,
	} satisfies DragDropOptions;
	uppy.setOptions(options);
}
</script>

<div class="uppy-Container" bind:this={container}></div>
