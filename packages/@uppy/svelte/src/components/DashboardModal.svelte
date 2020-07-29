<script lang="ts">
    import Base from './Base.svelte';
    import { onDestroy } from 'svelte';
    import type { Uppy, Plugin } from '@uppy/core';
    import * as Dashboard from '@uppy/dashboard';
    export let uppy: Uppy;
    export let pluginOptions: Dashboard.DashboardOptions;
    const pluginType = Dashboard;
    const defaultOptions = { id: 'svelte:DashboardModal' };
    $: props = { 
        ...defaultOptions,
        ...pluginOptions
    };
</script>

<Base {uppy} {props} {pluginType} />