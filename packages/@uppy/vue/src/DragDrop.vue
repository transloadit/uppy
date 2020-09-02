<template>
  <div ref="container" />
</template>
<script>
import DragDropPlugin from '@uppy/drag-drop'

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
    }
  },
  mounted () {
    this.installPlugin()
  },
  methods: {
    installPlugin () {
      const uppy = this.uppy
      const options = {
        id: 'vue:DragDrop',
        ...this.props,
        target: this.$refs.container
      }
      uppy.use(DragDropPlugin, options)
      this.plugin = uppy.getPlugin(options.id)
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
    props (current, old) {
      if (JSON.stringify(old) !== JSON.stringify(current)) {
        this.uninstallPlugin()
        this.installPlugin()
      }
    }
  }
}
</script>
