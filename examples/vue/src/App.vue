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
    <dashboard
      v-if="showInlineDashboard"
      :uppy="uppy"
      :props="{
        metaFields: [{ id: 'name', name: 'Name', placeholder: 'File name' }]
      }"
    />
    <h2>Modal Dashboard</h2>
    <div>
      <button @click="open = true">Show Dashboard</button>
    <dashboard-modal
      :uppy="uppy2" 
      :open="open" 
      :props="{
        onRequestCloseModal: handleClose
      }"
    />
    </div>

    <h2>Drag Drop Area</h2>
    <drag-drop 
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
    <progress-bar 
      :uppy="uppy"
      :props="{
        hideAfterFinish: false
      }"
    />
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import Vue from 'vue'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { Dashboard, DashboardModal, DragDrop, ProgressBar } from '@uppy/vue'

export default {
  name: 'App',
  components: {
    Dashboard,
    DashboardModal,
    DragDrop,
    ProgressBar
  },
  computed: {
    uppy: () => new Uppy({ id: 'uppy1', autoProceed: true, debug: true })
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' }),
    uppy2: () => new Uppy({ id: 'uppy2', autoProceed: false, debug: true })
      .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' }),
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
  
}
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
