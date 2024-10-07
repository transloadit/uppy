<script
  lang="ts"
  generics="M extends import('@uppy/utils/lib/UppyFile').Meta, B extends import('@uppy/utils/lib/UppyFile').Body"
>
  import { onMount, onDestroy } from 'svelte'
  import type { Uppy } from '@uppy/core'
  import ProgressBarPlugin from '@uppy/progress-bar'

  let container: HTMLElement
  let plugin: ProgressBarPlugin<M, B>

  export let uppy: Uppy<M, B>
  export let props: Object | undefined = {}

  const installPlugin = () => {
    const options = {
      id: 'svelte:ProgressBar',
      inline: true,
      ...props,
      target: container,
    }

    uppy.use(ProgressBarPlugin, options)
    plugin = uppy.getPlugin(options.id) as ProgressBarPlugin<M, B>
  }
  const uninstallPlugin = (uppyInstance: Uppy<M, B> = uppy) => {
    if (plugin != null) uppyInstance.removePlugin(plugin)
  }

  onMount(() => installPlugin())

  onDestroy(() => uninstallPlugin())
  $: {
    const options = {
      id: 'svelte:ProgressBar',
      ...props,
      target: container,
    }
    uppy.setOptions(options)
  }
</script>

<div class="uppy-Container" bind:this={container}></div>
