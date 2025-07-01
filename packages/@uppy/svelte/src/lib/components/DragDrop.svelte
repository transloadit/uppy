<script
  lang="ts"
  generics="M extends import('@uppy/utils/lib/UppyFile').Meta, B extends import('@uppy/utils/lib/UppyFile').Body"
>
import type { Uppy } from "@uppy/core";
import DragDropPlugin from "@uppy/drag-drop";
import { onDestroy, onMount } from "svelte";

let container: HTMLElement;
let plugin: DragDropPlugin<M, B>;

export let uppy: Uppy<M, B>;
export const props: Object | undefined = {};

const installPlugin = () => {
	const options = {
		id: "svelte:DragDrop",
		inline: true,
		...props,
		target: container,
	};

	uppy.use(DragDropPlugin, options);
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
	};
	uppy.setOptions(options);
}
</script>

<div class="uppy-Container" bind:this={container}></div>
