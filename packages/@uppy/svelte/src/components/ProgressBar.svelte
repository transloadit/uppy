<script lang="ts">
    import Base from './Base.svelte';
    import type { Uppy } from '@uppy/core';
    import * as ProgressBar from '@uppy/progress-bar';
    export let uppy: Uppy;
    export let pluginOptions: ProgressBar.ProgressBarOptions;
    const pluginType = ProgressBar.default;
    const defaultOptions = { id: 'svelte:ProgressBar' };
    $: props = { 
        ...defaultOptions,
        ...pluginOptions
    };
</script>

<Base {uppy} {props} {pluginType} />