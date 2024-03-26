<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy } from '@uppy/core';
  import DashboardPlugin from '@uppy/dashboard'

  type M = any
  type B = any

  let container: HTMLElement;
  let plugin: DashboardPlugin<M, B>;

  export let uppy: Uppy<M, B>;
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
    plugin = uppy.getPlugin(options.id) as DashboardPlugin<M, B>;
  }
  const uninstallPlugin = (uppyInstance: Uppy<M, B> = uppy) => {
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
<div class="uppy-Container" bind:this={container} />