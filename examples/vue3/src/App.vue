<template>
  <div id="app">
    <!-- <HelloWorld msg="Welcome to Uppy Vue Demo"/> -->
    <h1>Welcome to Uppy Vue Demo!</h1>
    <dashboard
      :uppy="uppy1" 
      :props="{
        onRequestCloseModal: handleClose
      }"
    />
    <button @click="open = true">
      Open the dashboard
    </button>
    <dashboard-modal
      :uppy="uppy2" 
      :open="open" 
      :props="{
        onRequestCloseModal: handleClose
      }"
    />
  </div>
</template>

<script>
import Uppy from '@uppy/core'
import { Dashboard, DashboardModal } from '@uppy/vue'

export default {
  name: 'App',
  components: {
    Dashboard,
    DashboardModal
  },
  computed: {
    uppy1: () => new Uppy(),
    uppy2: () => new Uppy(),
  },
  data () {
    return {
      open: false
    }
  },
  methods: {
    handleClose() { this.open = false }
  }
}
</script>
<style src='@uppy/core/dist/style.css'></style> 
<style src='@uppy/dashboard/dist/style.css'></style> 


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
