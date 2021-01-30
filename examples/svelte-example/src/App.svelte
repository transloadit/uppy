<script lang="ts">
	import { Dashboard, DashboardModal, DragDrop, ProgressBar } from "@uppy/svelte"
	import Uppy from "@uppy/core"
	import Webcam from '@uppy/webcam'
	import XHRUpload from '@uppy/xhr-upload'

	let createUppy = () => Uppy().use(Webcam).use(XHRUpload, {
		bundle: true,
		endpoint: 'http://localhost:9967/upload',
		metaFields: ['something'],
		fieldName: 'files'
	})

	let uppy1 = createUppy()
	let uppy2 = createUppy() 

	let open = false;
	let showInlineDashboard = true;
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
<style global>
	@import "@uppy/core/dist/style.min.css";
	@import "@uppy/dashboard/dist/style.min.css";
	@import "@uppy/drag-drop/dist/style.min.css";
	@import "@uppy/progress-bar/dist/style.min.css";
	input[type="checkbox"] {
		user-select: none;
	}
</style>