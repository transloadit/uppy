<template>
  <dashboard :uppy="uppy" />
</template>

<script>
import Vue from 'vue'
import Uppy from '@uppy/core'
import { Dashboard } from '@uppy/vue'

export default {
  name: 'App',
  components: {
    Dashboard,
  },
  computed: {
    uppy: () => new Uppy(),
  },
}
</script>

<style src="@uppy/core/dist/style.css"></style>
<style src="@uppy/dashboard/dist/style.css"></style>
