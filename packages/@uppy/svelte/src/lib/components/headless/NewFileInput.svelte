<script lang="ts">
  import { getContext, mount } from 'svelte'
  import {
    NewFileInput as PreactNewFileInput,
    type NewFileInputProps,
    type UppyContext,
  } from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
  import { UppyContextKey } from './UppyContextProvider.svelte'

  const props: Omit<NewFileInputProps, 'ctx'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(PreactNewFileInput, {
          ...props,
          ctx,
        } satisfies NewFileInputProps),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
