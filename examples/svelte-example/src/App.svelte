<script lang="ts">
	import { onMount } from "svelte"
	import { Dashboard, DashboardModal, DragDrop, ProgressBar } from "@uppy/svelte"
	import { Uppy } from "@uppy/core"
	import Webcam from '@uppy/webcam'

	let uppy1: Uppy = new Uppy().use(Webcam)
	let uppy2: Uppy = new Uppy().use(Webcam)

	let open = false;
	let showInlineDashboard = false;
</script>

<main>
	<h1>Welcome to the <code>@uppy/svelte</code> demo!</h1>
	<h2>Inline Dashboard</h2>
	<label>
      <input
        type="checkbox"
				bind:checked={showInlineDashboard}
			/>
      Show Dashboard
	</label>
	{#if showInlineDashboard}
		<Dashboard 
			uppy={uppy1}
			plugins={['Webcam']}
		/>
	{/if}
	<h2>Modal Dashboard</h2>
	<div>
		<button on:click={() => open = true}>Show Dashboard</button>
		<DashboardModal 
			uppy={uppy2} 
			open={open} 
			props={{
				onRequestCloseModal: () => open = false,
				plugins: ['Webcam']
			}} 
		/>
	</div>

	<h2>Drag Drop Area</h2>
	<DragDrop 
		uppy={uppy1}
	/>

	<h2>Progress Bar</h2>
	<ProgressBar 
		uppy={uppy1}
		props={{
			hideAfterFinish: false
		}}
	/>
</main>
<style>
	input[type="checkbox"] {
		user-select: none;
	}
</style>