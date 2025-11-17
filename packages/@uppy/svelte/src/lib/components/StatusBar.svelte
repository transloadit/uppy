<script
  lang="ts"
  generics="M extends import('@uppy/core').Meta, B extends import('@uppy/core').Body"
>
import type { Uppy } from "@uppy/core";
import StatusBarPlugin, { type StatusBarOptions } from "@uppy/status-bar";
import { onDestroy, onMount } from "svelte";

let container: HTMLElement;
let plugin: StatusBarPlugin<M, B>;

export let uppy: Uppy<M, B>;
export let props: StatusBarOptions | undefined = {};

const installPlugin = () => {
	const options = {
		id: "svelte:StatusBar",
		...props,
		target: container,
	} satisfies StatusBarOptions;

	uppy.use(StatusBarPlugin<M, B>, options);
	plugin = uppy.getPlugin(options.id)!;
};
const uninstallPlugin = (uppyInstance: Uppy<M, B> = uppy) => {
	if (plugin != null) uppyInstance.removePlugin(plugin);
};

onMount(() => installPlugin());

onDestroy(() => uninstallPlugin());
$: {
	const options = {
		id: "svelte:StatusBar",
		...props,
		target: container,
	} satisfies StatusBarOptions;
	plugin?.setOptions(options);
}
</script>

<div class="uppy-Container" bind:this={container}></div>
