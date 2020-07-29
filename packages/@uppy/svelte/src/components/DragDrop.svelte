<script lang="ts">
    import Base from './Base.svelte';
    import { onDestroy } from 'svelte';
    import type { Uppy, Plugin } from '@uppy/core';
    import * as DragDrop from '@uppy/drag-drop';
    export let uppy: Uppy;
    export let pluginOptions: DragDrop.DragDropOptions;
    const pluginType = DragDrop;
    const defaultOptions = { id: 'svelte:DragDrop' };
    $: props = { 
        ...defaultOptions,
        ...pluginOptions
    };
</script>

<Base {uppy} {props} {pluginType} />