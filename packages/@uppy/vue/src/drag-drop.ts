import { defineComponent, ref, h, type PropType } from 'vue'
import DragDropPlugin, { type DragDropOptions } from '@uppy/drag-drop'
import { Uppy } from '@uppy/core'
import useUppy from './useUppy.js'

export default defineComponent({
  name: 'DragDrop',
  props: {
    uppy: {
      type: Uppy<any, any>,
      required: true,
    },
    props: {
      type: Object as PropType<DragDropOptions>,
    },
  },
  setup(props) {
    const containerRef = ref<string>()
    const pluginRef = ref<DragDropPlugin<any, any>>()
    const propsRef = ref(props.props)
    const onMount = () => {
      const { uppy } = props
      const options = {
        id: 'DragDrop',
        ...props.props,
        target: containerRef.value,
      }
      uppy.use(DragDropPlugin, options)
      pluginRef.value = uppy.getPlugin(options.id) as DragDropPlugin<any, any>
    }

    useUppy(onMount, pluginRef, props.uppy, propsRef)

    return () =>
      h('div', {
        ref: containerRef,
      })
  },
})
