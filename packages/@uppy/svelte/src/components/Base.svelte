<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { Uppy, Plugin } from '@uppy/core';
    
    export let uppy: Uppy;
    export let props;
    export let pluginType;

    let plugin: Plugin;
    let container: HTMLElement;
    let isMounted: boolean = false;

    $: if (uppy && isMounted) {
        plugin && uninstall()
        uppy.use(pluginType, {
            target: container,
            ...props
        });
        plugin = uppy.getPlugin(props.id);
    }

    function uninstall() {
        uppy.removePlugin(plugin);
    }

    onMount(() => isMounted = true)
	onDestroy(() => uninstall());
</script>

{#if !props?.target }
    <div bind:this={container}></div>
{/if}
