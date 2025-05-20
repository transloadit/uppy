<script context="module" lang="ts">
  import type Uppy from '@uppy/core';
  import { createUppyEventAdapter, type UploadStatus } from '@uppy/core'

  export const UppyContextKey = 'uppy-context';
  export type { UppyContext } from '@uppy/components';
</script>

<script lang="ts">
  import { setContext, onMount } from 'svelte';

  export let uppy: Uppy;

  let status: UploadStatus = 'init';
  let progress = 0;

  onMount(() => {
    if (!uppy) {
      throw new Error(
        'ContextProvider: passing `uppy` as a prop is required',
      );
    }

    const uppyEventAdapter = createUppyEventAdapter({
      uppy,
      onStatusChange: (newStatus: UploadStatus) => {
        status = newStatus
      },
      onProgressChange: (newProgress: number) => {
        progress = newProgress
      },
    })

    return () => uppyEventAdapter.cleanup()
  });

  // Create a reactive store from our context values
  $: contextValue = {
    uppy,
    status,
    progress,
  };

  // Set the context for child components to use
  $: setContext(UppyContextKey, contextValue);
</script>

<slot />
