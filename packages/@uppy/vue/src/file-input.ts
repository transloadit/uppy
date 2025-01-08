import { defineComponent, ref, h, type PropType } from 'vue'
import FileInputPlugin, { type FileInputOptions } from '@uppy/file-input'
import { Uppy } from '@uppy/core'
import useUppy from './useUppy.js'

export default defineComponent({
  name: 'FileInput',
  props: {
    uppy: {
      type: Uppy<any, any>,
      required: true,
    },
    props: {
      type: Object as PropType<FileInputOptions>,
    },
  },
  setup(props) {
    const containerRef = ref<string>()
    const pluginRef = ref<FileInputPlugin<any, any>>()
    const propsRef = ref(props.props)
    const onMount = () => {
      const { uppy } = props
      const options = {
        id: 'FileInput',
        ...props.props,
        target: containerRef.value,
      }
      uppy.use(FileInputPlugin, options)
      pluginRef.value = uppy.getPlugin(options.id) as FileInputPlugin<any, any>
    }

    useUppy(onMount, pluginRef, props.uppy, propsRef)

    return () =>
      h('div', {
        ref: containerRef,
      })
  },
})
