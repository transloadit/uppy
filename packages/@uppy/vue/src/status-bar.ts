import type { Uppy } from '@uppy/core'
import StatusBarPlugin, { type StatusBarOptions } from '@uppy/status-bar'
import { defineComponent, h, type PropType, ref } from 'vue'
import useUppy from './useUppy.js'

export default defineComponent({
  name: 'StatusBar',
  props: {
    uppy: {
      type: Object as PropType<Uppy<any, any>>,
      required: true,
    },
    props: {
      type: Object as PropType<StatusBarOptions>,
    },
  },
  setup(props) {
    const containerRef = ref<string>()
    const pluginRef = ref<StatusBarPlugin<any, any>>()
    const propsRef = ref(props.props)
    const onMount = () => {
      const { uppy } = props
      const options = {
        id: 'StatusBar',
        ...props.props,
        target: containerRef.value,
      }
      uppy.use(StatusBarPlugin, options)
      pluginRef.value = uppy.getPlugin(options.id) as StatusBarPlugin<any, any>
    }

    useUppy(onMount, pluginRef, props.uppy, propsRef)

    return () =>
      h('div', {
        ref: containerRef,
      })
  },
})
