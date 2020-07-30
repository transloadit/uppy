<script lang="ts">
    import Base from './Base.svelte';
    import type { Uppy } from '@uppy/core';
    import * as Dashboard from '@uppy/dashboard';
    export let uppy: Uppy;
    export let pluginOptions: Dashboard.DashboardOptions;
    const pluginType = Dashboard.default;
    const defaultOptions = { id: 'svelte:Dashboard', inline: true };
    $: props = { 
        ...defaultOptions,
        ...pluginOptions
    };
</script>

<Base {uppy} {props} {pluginType} />