<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy, Plugin } from '@uppy/core';
  import DragDropPlugin from '@uppy/drag-drop'

  let container: HTMLElement;
  let plugin: DragDropPlugin; 

  export let uppy: Uppy;
  export let props: Object | undefined = {};

  const installPlugin = () => {
    const options = {
      id: 'svelte:DragDrop',
      inline: true,
      ...props,
      target: container
    }

    uppy.use(DragDropPlugin, options);
    plugin = uppy.getPlugin(options.id) as DragDropPlugin;
  }
  const uninstallPlugin = (uppyInstance: Uppy = uppy) => {
    uppyInstance.removePlugin(plugin);
  }

  onMount(() => installPlugin())

  onDestroy(() => uninstallPlugin())
  $: {
    const options = {
      id: 'svelte:DragDrop',
      ...props,
      target: container
    }
    uppy.setOptions(options)
  }
</script>
<div bind:this={container} />