import DashboardPlugin from '@uppy/dashboard'
import { shallowEqualObjects } from 'shallow-equal'

export default {
  data () {
    return {
      plugin: {}
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
    uninstallPlugin (uppy) {
      uppy.removePlugin(this.plugin)
    }
  },
  beforeDestroy () {
    this.uninstallPlugin(this.uppy)
  },
  watch: {
    uppy (current, old) {
      if (old !== current) {
        this.uninstallPlugin(old)
        this.installPlugin()
      }
    },
    open (current, old) {
      if (current && !old) {
        this.plugin.openModal()
      }
      if (!current && old) {
        this.plugin.closeModal()
      }
    },
    props (current, old) {
      if (!shallowEqualObjects(current, old)) {
        this.plugin.setOptions({ ...current })
      }
    }
  },
  render (createElement) {
    return createElement('div', {
      ref: 'container'
    })
  }
}
