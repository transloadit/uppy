<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy } from '@uppy/core';
  import StatusBarPlugin from '@uppy/status-bar'
  
  type M = any
  type B = any

  let container: HTMLElement;
  let plugin: StatusBarPlugin<M, B>;

  export let uppy: Uppy<M, B>;
  export let props: Object | undefined = {};

  const installPlugin = () => {
    const options = {
      id: 'svelte:StatusBar',
      inline: true,
      ...props,
      target: container
    }

    uppy.use(StatusBarPlugin, options);
    plugin = uppy.getPlugin(options.id) as StatusBarPlugin<M, B>;
  }
  const uninstallPlugin = (uppyInstance: Uppy<M, B> = uppy) => {
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
<div class="uppy-Container" bind:this={container} />