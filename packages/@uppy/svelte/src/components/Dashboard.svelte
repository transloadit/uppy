<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy } from '@uppy/core';
  import DashboardPlugin from '@uppy/dashboard'

  let container: HTMLElement;
  let plugin: DashboardPlugin;

  export let uppy: Uppy;
  export let props: Object | undefined = {};
  export let plugins: string[] = [];

  const installPlugin = () => {
    const options = {
      id: 'svelte:Dashboard',
      inline: true,
      plugins,
      ...props,
      target: container
    }

    uppy.use(DashboardPlugin, options);
    plugin = uppy.getPlugin(options.id) as DashboardPlugin;
  }
  const uninstallPlugin = (uppyInstance: Uppy = uppy) => {
    uppyInstance.removePlugin(plugin);
  }

  onMount(() => installPlugin())

  onDestroy(() => uninstallPlugin())
  $: {
    const options = {
      id: 'svelte:Dashboard',
      inline: true,
      plugins,
      ...props,
      target: container
    }
    uppy.setOptions(options)
  }
</script>
<div bind:this={container} />