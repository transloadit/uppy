<script
  lang="ts"
  generics="M extends import('@uppy/utils').Meta, B extends import('@uppy/utils').Body"
>
import type { Uppy } from "@uppy/core";
import DashboardPlugin, { type DashboardOptions } from "@uppy/dashboard";
import { onDestroy, onMount } from "svelte";

let container: HTMLElement;
let plugin: DashboardPlugin<M, B>;

export let uppy: Uppy<M, B>;
export let props: DashboardOptions<M, B> | undefined = {};
export let open: boolean;
let lastOpen: boolean = open;

export let plugins: string[] = [];

const installPlugin = () => {
	const options = {
		id: "svelte:DashboardModal",
		plugins,
		...props,
		target: container,
	} satisfies DashboardOptions<M, B>;

	uppy.use(DashboardPlugin<M, B>, options);
	plugin = uppy.getPlugin(options.id) as DashboardPlugin<M, B>;
	if (open) plugin.openModal();
};
const uninstallPlugin = (uppyInstance: Uppy<M, B> = uppy) => {
	if (plugin != null) uppyInstance.removePlugin(plugin);
};

onMount(() => installPlugin());

onDestroy(() => uninstallPlugin());
$: {
	const options = {
		id: "svelte:DashboardModal",
		plugins,
		...props,
		target: container,
	} satisfies DashboardOptions<M, B>;
	plugin?.setOptions(options);
}
$: {
	if (open && !lastOpen) {
		plugin.openModal();
	}
	if (!open && lastOpen) {
		plugin.closeModal();
	}
	lastOpen = open;
}
</script>

<div class="uppy-Container" bind:this={container}></div>
