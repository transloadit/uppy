<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy } from '@uppy/core';
  import DashboardPlugin from '@uppy/dashboard'

  let container: HTMLElement;
  let plugin: DashboardPlugin;

  export let uppy: Uppy;
  export let props: Object | undefined = {};
  export let open: boolean;
  let lastOpen: boolean = open;

  export let plugins: string[] = [];

  const installPlugin = () => {
    const options = {
      id: 'svelte:DashboardModal',
      plugins,
      ...props,
      target: container
    }

    uppy.use(DashboardPlugin, options);
    plugin = uppy.getPlugin(options.id) as DashboardPlugin;
    if(open) plugin.openModal();
  }
  const uninstallPlugin = (uppyInstance: Uppy = uppy) => {
    uppyInstance.removePlugin(plugin);
  }

  onMount(() => installPlugin())

  onDestroy(() => uninstallPlugin())
  $: {
    const options = {
      id: 'svelte:DashboardModal',
      plugins,
      ...props,
      target: container
    }
    uppy.setOptions(options)
  }
  $: {
    if(open && !lastOpen) {
      plugin.openModal()
    }
    if (!open && lastOpen) {
      plugin.closeModal()
    }
    lastOpen = open;
  }
</script>
<div bind:this={container} />