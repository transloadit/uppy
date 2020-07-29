<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { Uppy, Plugin } from '@uppy/core';
    
    export let uppy: Uppy;
    export let props;
    export let pluginType;

    let plugin: Plugin;
    let container: HTMLElement;

    $: {
        uppy.use(pluginType, {
            target: container,
            ...props
        });
        plugin = uppy.getPlugin(props.id);
    }

    function uninstall() {
        uppy.removePlugin(plugin);
    }

	onDestroy(() => uninstall());
</script>

<div bind:this={container}></div>