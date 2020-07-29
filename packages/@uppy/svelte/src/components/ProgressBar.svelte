<script lang="ts">
    import Base from './Base.svelte';
    import { onDestroy } from 'svelte';
    import type { Uppy, Plugin } from '@uppy/core';
    import * as ProgressBar from '@uppy/progress-bar';
    export let uppy: Uppy;
    export let pluginOptions: ProgressBar.ProgressBarOptions;
    const pluginType = ProgressBar;
    const defaultOptions = { id: 'svelte:ProgressBar' };
    $: props = { 
        ...defaultOptions,
        ...pluginOptions
    };
</script>

<Base {uppy} {props} {pluginType} />