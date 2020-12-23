<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy } from '@uppy/core';
  import StatusBarPlugin from '@uppy/status-bar'

  let container: HTMLElement;
  let plugin: StatusBarPlugin; 

  export let uppy: Uppy;
  export let props: Object | undefined = {};

  const installPlugin = () => {
    const options = {
      id: 'svelte:StatusBar',
      inline: true,
      ...props,
      target: container
    }

    uppy.use(StatusBarPlugin, options);
    plugin = uppy.getPlugin(options.id) as StatusBarPlugin;
  }
  const uninstallPlugin = (uppyInstance: Uppy = uppy) => {
    uppyInstance.removePlugin(plugin);
  }

  onMount(() => installPlugin())

  onDestroy(() => uninstallPlugin())
  $: {
    const options = {
      id: 'svelte:StatusBar',
      ...props,
      target: container
    }
    uppy.setOptions(options)
  }
</script>
<div bind:this={container} />