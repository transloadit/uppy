<script lang="ts">
  import { getContext, mount } from 'svelte'
  import {
    FilesGrid as PreactFilesGrid,
    type FilesGridProps,
    type UppyContext,
  } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
  import { UppyContextKey } from './UppyContextProvider.svelte'

  const props: Omit<FilesGridProps, 'ctx'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(PreactFilesGrid, {
          ...props,
          ctx,
        } satisfies FilesGridProps),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
