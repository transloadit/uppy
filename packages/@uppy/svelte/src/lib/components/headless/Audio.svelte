<script lang="ts">
  import { getContext, mount } from 'svelte'
  import {
    Audio as PreactAudio,
    type AudioProps,
    type UppyContext,
  } from '@uppy/components'
  import { h as preactH } from 'preact'
  import { render as preactRender } from 'preact/compat'
  import { UppyContextKey } from './UppyContextProvider.svelte'

  const props: Omit<AudioProps, 'ctx' | 'render'> = $props()
  const ctx = getContext<UppyContext>(UppyContextKey)
  let container: HTMLElement

  $effect(() => {
    if (container) {
      preactRender(
        preactH(PreactAudio, {
          ...props,
          ctx,
          render: (el: Element | null, node: any) => {
            if (el) {
              mount(node, { target: el })
            }
          },
        } satisfies AudioProps),
        container,
      )
    }
  })
</script>

<div bind:this={container}></div>
