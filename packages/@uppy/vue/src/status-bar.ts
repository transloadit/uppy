import { defineComponent, ref, h, type PropType } from 'vue'
import StatusBarPlugin, { type StatusBarOptions } from '@uppy/status-bar'
import { Uppy } from '@uppy/core'
import useUppy from './useUppy.js'

export default defineComponent({
  name: 'StatusBar',
  props: {
    uppy: {
      type: Uppy<any, any>,
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
