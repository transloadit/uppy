<script lang="ts">
  import { getContext, mount } from 'svelte'
  import {
    ImageEditor as PreactImageEditor,
    type ImageEditorProps,
    type UppyContext,
  } from '@uppy/components'
  import { h as preactH } from 'preact'
  import { render as preactRender } from 'preact/compat'
  import { UppyContextKey } from './UppyContextProvider.svelte'

  const props: Omit<ImageEditorProps, 'ctx' | 'render'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(PreactImageEditor, {
          ...props,
          ctx,
          render: (el, node) => {
            if (el) {
              mount(node, { target: el })
            }
          },
        } satisfies ImageEditorProps),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
