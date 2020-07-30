<script lang="ts">
    import Base from './Base.svelte';
    import type { Uppy } from '@uppy/core';
    import * as Dashboard from '@uppy/dashboard';
    export let uppy: Uppy;
    export let pluginOptions: Dashboard.DashboardOptions;
    const pluginType = Dashboard.default;
    const defaultOptions = { id: 'svelte:DashboardModal', target: 'body' };
    $: props = { 
        ...defaultOptions,
        ...pluginOptions
    };
</script>

<Base {uppy} {props} {pluginType} />