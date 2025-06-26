<script
  lang="ts"
  generics="M extends import('@uppy/utils/lib/UppyFile').Meta, B extends import('@uppy/utils/lib/UppyFile').Body"
>
import type { Uppy } from "@uppy/core";
import DashboardPlugin from "@uppy/dashboard";
import { onDestroy, onMount } from "svelte";

let container: HTMLElement;
let plugin: DashboardPlugin<M, B>;

export let uppy: Uppy<M, B>;
export const props: Object | undefined = {};
export let open: boolean;
let lastOpen: boolean = open;

export const plugins: string[] = [];

const installPlugin = () => {
	const options = {
		id: "svelte:DashboardModal",
		plugins,
		...props,
		target: container,
	};

	uppy.use(DashboardPlugin, options);
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
	};
	uppy.setOptions(options);
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
