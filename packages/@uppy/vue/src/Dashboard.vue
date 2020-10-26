<template>
  <div ref="container" />
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import type { Uppy, Plugin } from '@uppy/core'
import DashboardPlugin from '@uppy/dashboard'
import { shallowEqualObjects } from 'shallow-equal'

interface Data {
  plugin: Plugin 
}
interface Props {
  uppy: Uppy,
  props: Object,
  plugins: Plugin[]
}
interface Methods {
  installPlugin(): void,
  uninstallPlugin(uppy: Uppy): void,
}

export default Vue.extend<Data, Methods, unknown, Props>({
  data () {
    return {
      plugin: {} as Plugin
    }
  },
  props: {
    uppy: {
      required: true
    },
    props: {
      type: Object
    },
    plugins: {
      type: Array
    }
  },
  mounted () {
    this.installPlugin()
  },
  methods: {
    installPlugin () {
      const uppy = this.uppy
      const options = {
        id: 'vue:Dashboard',
        inline: true,
        plugins: this.plugins,
        ...this.props,
        target: this.$refs.container
      }
      uppy.use(DashboardPlugin, options)
      this.plugin = uppy.getPlugin(options.id)
    },
    uninstallPlugin (uppy: Uppy) {
      uppy.removePlugin(this.plugin)
    }
  },
  beforeDestroy () {
    this.uninstallPlugin(this.uppy)
  },
  watch: {
    uppy (current: Uppy, old: Uppy) {
      if (old !== current) {
        this.uninstallPlugin(old)
        this.installPlugin()
      }
    },
    props (current, old) {
      if (!shallowEqualObjects(current, old)) {
        this.plugin.setOptions(current)
      }
    }
  }
})
</script>
