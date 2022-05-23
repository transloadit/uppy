<script setup>
import { Dashboard, DashboardModal, DragDrop, ProgressBar } from '@uppy/vue'
</script>

<template>
  <div id="app">
    <!-- <HelloWorld msg="Welcome to Uppy Vue Demo"/> -->
    <h1>Welcome to Uppy Vue Demo!</h1>
    <h2>Inline Dashboard</h2>
    <label>
      <input
        type="checkbox"
        :checked="showInlineDashboard"
        @change="(event) => {
          showInlineDashboard = event.target.checked
        }"
      />
      Show Dashboard
    </label>
    <Dashboard
      v-if="showInlineDashboard"
      :uppy="uppy"
      :props="{
        metaFields: [{ id: 'name', name: 'Name', placeholder: 'File name' }]
      }"
    />
    <h2>Modal Dashboard</h2>
    <div>
      <button @click="open = true">Show Dashboard</button>
    <DashboardModal
      :uppy="uppy2" 
      :open="open" 
      :props="{
        onRequestCloseModal: handleClose
      }"
    />
    </div>

    <h2>Drag Drop Area</h2>
    <DragDrop 
      :uppy="uppy"
      :props="{
        locale: {
          strings: {
            chooseFile: 'Boop a file',
            orDragDrop: 'or yoink it here'
          }
        }
      }"
    />

    <h2>Progress Bar</h2>
    <ProgressBar 
      :uppy="uppy"
      :props="{
        hideAfterFinish: false
      }"
    />
  </div>
</template>

<script>
import Uppy from '@uppy/core'
import Transloadit from '@uppy/transloadit'
import { defineComponent } from 'vue'

import generateSignatureIfSecret from './generateSignatureIfSecret.js'

const {
  VITE_TRANSLOADIT_KEY : TRANSLOADIT_KEY,
  // Your Transloadit secret SHALL NOT be accessible in your Vue file, this is
  // there for illustration purposes only.
  VITE_TRANSLOADIT_SECRET : TRANSLOADIT_SECRET,
  VITE_TRANSLOADIT_TEMPLATE : TRANSLOADIT_TEMPLATE,
  VITE_TRANSLOADIT_SERVICE_URL : TRANSLOADIT_SERVICE_URL,
} = import.meta.env

async function getAssemblyOptions () {
  return generateSignatureIfSecret(TRANSLOADIT_SECRET, {
    auth: {
      key: TRANSLOADIT_KEY,
    },
    // It's more secure to use a template_id and enable
    // Signature Authentication
    template_id: TRANSLOADIT_TEMPLATE,
  })
}

export default defineComponent({
  computed: {
    uppy: () => new Uppy({ id: 'uppy1', autoProceed: true, debug: true })
      .use(Transloadit, {
        service: TRANSLOADIT_SERVICE_URL,
        waitForEncoding: true,
        getAssemblyOptions,
      }),
    uppy2: () => new Uppy({ id: 'uppy2', autoProceed: false, debug: true })
      .use(Transloadit, {
        service: TRANSLOADIT_SERVICE_URL,
        waitForEncoding: true,
        getAssemblyOptions,
      }),
  },
  data () {
    return {
      open: false,
      showInlineDashboard: false
    }
  },
  methods: {
    handleClose() { this.open = false }
  },
})
</script>

<style src='@uppy/core/dist/style.css'></style> 
<style src='@uppy/dashboard/dist/style.css'></style> 
<style src='@uppy/drag-drop/dist/style.css'></style> 
<style src='@uppy/progress-bar/dist/style.css'></style> 

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
