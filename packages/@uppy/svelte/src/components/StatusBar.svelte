<script lang="ts">
    import Base from './Base.svelte';
    import type { Uppy } from '@uppy/core';
    import * as StatusBar from '@uppy/status-bar';
    export let uppy: Uppy;
    export let pluginOptions: StatusBar.StatusBarOptions;
    const pluginType = StatusBar.default;
    const defaultOptions = { id: 'svelte:StatusBar' };
    $: props = { 
        ...defaultOptions,
        ...pluginOptions
    };
</script>

<Base {uppy} {props} {pluginType} />