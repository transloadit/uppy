<template>
  <div id="app">
    <HelloWorld msg="Welcome to Uppy Vue Demo"/>

    <dashboard-modal 
      :uppy="uppy" 
      :open="open" 
      :props="{
        onRequestCloseModal: handleClose
      }"
    />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

import Uppy from '@uppy/core'
import { DashboardModal } from '../../../packages/@uppy/vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
    DashboardModal
  },
  computed: {
    uppy: () => new Uppy()
  },
  data () {
    return {
      open: true
    }
  },
  methods: {
    handleClose: () => ''
  }
}
</script>

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
