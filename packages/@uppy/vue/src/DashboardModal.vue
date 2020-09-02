<template>
  <div ref="container" />
</template>
<script>
import DashboardPlugin from '@uppy/dashboard'

export default {
  data () {
    return {
      plugin: null
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
    },
    open: {
      type: Boolean,
      required: true
    }
  },
  mounted () {
    this.installPlugin()
  },
  methods: {
    installPlugin () {
      const uppy = this.uppy
      const options = {
        id: 'vue:DashboardModal',
        plugins: this.plugins,
        ...this.props,
        target: this.$refs.container
      }
      uppy.use(DashboardPlugin, options)
      this.plugin = uppy.getPlugin(options.id)
      if (this.open) {
        this.plugin.openModal()
      }
    },
    uninstallPlugin (uppy = this.uppy) {
      uppy.removePlugin(this.plugin)
    }
  },
  beforeDestroy () {
    this.uninstallPlugin()
  },
  watch: {
    uppy (current, old) {
      if (old !== current) {
        this.uninstallPlugin(old)
        this.installPlugin()
      }
    },
    open: {
      handler (current, old) {
        if (current && !old) {
          this.plugin.openModal()
        }
        if (!current && old) {
          this.plugin.closeModal()
        }
      }
    },
    props (current, old) {
      if (JSON.stringify(old) !== JSON.stringify(current)) {
        this.uninstallPlugin()
        this.installPlugin()
      }
    }
  }
}
</script>