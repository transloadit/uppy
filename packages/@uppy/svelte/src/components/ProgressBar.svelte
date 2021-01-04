<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy } from '@uppy/core';
  import ProgressBarPlugin from '@uppy/progress-bar'

  let container: HTMLElement;
  let plugin: ProgressBarPlugin; 

  export let uppy: Uppy;
  export let props: Object | undefined = {};

  const installPlugin = () => {
    const options = {
      id: 'svelte:ProgressBar',
      inline: true,
      ...props,
      target: container
    }

    uppy.use(ProgressBarPlugin, options);
    plugin = uppy.getPlugin(options.id) as ProgressBarPlugin;
  }
  const uninstallPlugin = (uppyInstance: Uppy = uppy) => {
    uppyInstance.removePlugin(plugin);
  }

  onMount(() => installPlugin())

  onDestroy(() => uninstallPlugin())
  $: {
    const options = {
      id: 'svelte:ProgressBar',
      ...props,
      target: container
    }
    uppy.setOptions(options)
  }
</script>
<div bind:this={container} />