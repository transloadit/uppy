<script lang="ts">
  import { getContext, mount } from 'svelte'
  import {
    Dropzone as PreactDropzone,
    type DropzoneProps,
    type UppyContext,
  } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
  import { UppyContextKey } from './UppyContextProvider.svelte'

  const props: Omit<DropzoneProps, 'ctx'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(PreactDropzone, {
          ...props,
          ctx,
        } satisfies DropzoneProps),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
