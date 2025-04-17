<script lang="ts">
  import { getContext, mount } from 'svelte'
  import {
    DragDrop as PreactDragDrop,
    type DragDropProps,
    type UppyContext,
  } from '@uppy/components'
  import { h as preactH } from 'preact'
  import { render as preactRender } from 'preact/compat'
  import { UppyContextKey } from './UppyContextProvider.svelte'

  const props: Omit<DragDropProps, 'ctx' | 'render'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(PreactDragDrop, {
          ...props,
          ctx,
          render: (el, node) => {
            if (el) {
              mount(node, { target: el })
            }
          },
        } satisfies DragDropProps),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
