import { defineComponent, ref, h, type PropType } from 'vue'
import ProgressBarPlugin, { type ProgressBarOptions } from '@uppy/progress-bar'
import { Uppy } from '@uppy/core'
import useUppy from './useUppy.js'

export default defineComponent({
  name: 'ProgressBar',
  props: {
    uppy: {
      type: Uppy<any, any>,
      required: true,
    },
    props: {
      type: Object as PropType<ProgressBarOptions>,
    },
  },
  setup(props) {
    const containerRef = ref<string>()
    const pluginRef = ref<ProgressBarPlugin<any, any>>()
    const propsRef = ref(props.props)
    const onMount = () => {
      const { uppy } = props
      const options = {
        id: 'ProgressBar',
        ...props.props,
        target: containerRef.value,
      }
      uppy.use(ProgressBarPlugin, options)
      pluginRef.value = uppy.getPlugin(options.id) as ProgressBarPlugin<
        any,
        any
      >
    }

    useUppy(onMount, pluginRef, props.uppy, propsRef)

    return () =>
      h('div', {
        ref: containerRef,
      })
  },
})
