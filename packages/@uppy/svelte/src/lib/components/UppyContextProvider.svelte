<script context="module" lang="ts">
  import type Uppy from '@uppy/core';
  import type { UploadStatus } from '@uppy/components';

  export const UppyContextKey = 'uppy-context';
  export type { UploadStatus, UppyContext } from '@uppy/components';
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

    const onUploadStarted = () => {
      status = 'uploading';
    };
    const onComplete = () => {
      status = 'complete';
      progress = 0;
    };
    const onError = () => {
      status = 'error';
      progress = 0;
    };
    const onProgress = (p: number) => {
      progress = p;
    };
    const onCancelAll = () => {
      status = 'init';
      progress = 0;
    };
    const onFileAdded = () => {
      status = 'ready';
    };
    const onPauseAll = () => {
      status = 'paused';
    };
    const onResumeAll = () => {
      status = 'uploading';
    };

    uppy.on('file-added', onFileAdded);
    uppy.on('progress', onProgress);
    uppy.on('upload', onUploadStarted);
    uppy.on('complete', onComplete);
    uppy.on('error', onError);
    uppy.on('cancel-all', onCancelAll);
    uppy.on('pause-all', onPauseAll);
    uppy.on('resume-all', onResumeAll);

    return () => {
      uppy.off('file-added', onFileAdded);
      uppy.off('progress', onProgress);
      uppy.off('upload', onUploadStarted);
      uppy.off('complete', onComplete);
      uppy.off('error', onError);
      uppy.off('cancel-all', onCancelAll);
      uppy.off('pause-all', onPauseAll);
      uppy.off('resume-all', onResumeAll);
    };
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
