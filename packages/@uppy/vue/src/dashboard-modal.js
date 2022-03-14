import DashboardPlugin from '@uppy/dashboard'
import { shallowEqualObjects } from 'shallow-equal'

import * as Vue from 'vue'
import { isVue2 } from './utils.js'

export default {
  data () {
    return {
      plugin: {},
    }
  },
  props: {
    uppy: {
      required: true,
    },
    props: {
      type: Object,
    },
    plugins: {
      type: Array,
    },
    open: {
      type: Boolean,
      required: true,
    },
  },
  mounted () {
    this.installPlugin()
  },
  methods: {
    installPlugin () {
      const { uppy } = this
      const options = {
        id: 'vue:DashboardModal',
        plugins: this.plugins,
        ...this.props,
        target: this.$refs.container,
      }
      uppy.use(DashboardPlugin, options)
      this.plugin = uppy.getPlugin(options.id)
      if (this.open) {
        this.plugin.openModal()
      }
    },
    uninstallPlugin (uppy) {
      uppy.removePlugin(this.plugin)
    },
  },
  beforeDestroy () {
    this.uninstallPlugin(this.uppy)
  },
  beforeUnmount () {
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
    },
  },
  render (...args) {
    // Hack to allow support for Vue 2 and 3
    if (isVue2(...args)) {
      // If it's first argument is a function, then it's a Vue 2 App
      const [createElement] = args
      return createElement('div', {
        ref: 'container',
      })
    }

    // Otherwise, we use the `h` function from the Vue package (in Vue 3 fashion)
    return Vue.h('div', {
      ref: 'container',
    })
  },
}
