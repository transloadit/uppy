import StatusBarPlugin from '@uppy/status-bar'
import { shallowEqualObjects } from 'shallow-equal'

// Cross compatibility dependencies
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
  },
  mounted () {
    this.installPlugin()
  },
  methods: {
    installPlugin () {
      const { uppy } = this
      const options = {
        id: 'vue:StatusBar',
        ...this.props,
        target: this.$refs.container,
      }
      uppy.use(StatusBarPlugin, options)
      this.plugin = uppy.getPlugin(options.id)
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

    // Other wise, we import the `h` function from the Vue package (in Vue 3 fashion)
    return Vue.h('div', {
      ref: 'container',
    })
  },
}
