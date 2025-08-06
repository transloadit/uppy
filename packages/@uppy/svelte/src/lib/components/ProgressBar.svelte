<script
  lang="ts"
  generics="M extends import('@uppy/utils/lib/UppyFile').Meta, B extends import('@uppy/utils/lib/UppyFile').Body"
>
import type { Uppy } from "@uppy/core";
import ProgressBarPlugin, { type ProgressBarOptions } from "@uppy/progress-bar";
import { onDestroy, onMount } from "svelte";

let container: HTMLElement;
let plugin: ProgressBarPlugin<M, B>;

export let uppy: Uppy<M, B>;
export let props: ProgressBarOptions | undefined = {};

const installPlugin = () => {
	const options = {
		id: "svelte:ProgressBar",
		...props,
		target: container,
	} satisfies ProgressBarOptions;

	uppy.use(ProgressBarPlugin<M, B>, options);
	plugin = uppy.getPlugin(options.id) as ProgressBarPlugin<M, B>;
};
const uninstallPlugin = (uppyInstance: Uppy<M, B> = uppy) => {
	if (plugin != null) uppyInstance.removePlugin(plugin);
};

onMount(() => installPlugin());

onDestroy(() => uninstallPlugin());
$: {
	const options = {
		id: "svelte:ProgressBar",
		...props,
		target: container,
	} satisfies ProgressBarOptions;
	uppy.setOptions(options);
}
</script>

<div class="uppy-Container" bind:this={container}></div>
