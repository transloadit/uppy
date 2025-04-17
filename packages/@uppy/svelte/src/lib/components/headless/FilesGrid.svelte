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

  const props: Omit<FilesGridProps, 'ctx' | 'render'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(PreactFilesGrid, {
          ...props,
          ctx,
          render: (el: Element | null, node: any) => {
            if (el) {
              mount(node, { target: el })
            }
          },
        } satisfies FilesGridProps),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
