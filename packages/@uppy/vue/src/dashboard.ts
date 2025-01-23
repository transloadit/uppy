import { defineComponent, ref, h, type PropType } from 'vue'
import DashboardPlugin, { type DashboardOptions } from '@uppy/dashboard'
import type { Uppy, Meta, Body } from '@uppy/core'
import useUppy from './useUppy.js'

type DashboardInlineOptions<M extends Meta, B extends Body> = Omit<
  DashboardOptions<M, B> & { inline: true },
  'inline'
>

export default defineComponent({
  name: 'Dashboard',
  props: {
    uppy: {
      type: Object as PropType<Uppy<any, any>>,
      required: true,
    },
    props: {
      type: Object as PropType<DashboardInlineOptions<any, any>>,
    },
  },
  setup(props) {
    const containerRef = ref<string>()
    const pluginRef = ref<DashboardPlugin<any, any>>()
    const propsRef = ref(props.props)
    const onMount = () => {
      const { uppy } = props
      const options = {
        id: 'Dashboard',
        inline: true,
        ...props.props,
        target: containerRef.value,
      }
      uppy.use(DashboardPlugin, options)
      pluginRef.value = uppy.getPlugin(options.id) as DashboardPlugin<any, any>
    }

    useUppy(onMount, pluginRef, props.uppy, propsRef)

    return () =>
      h('div', {
        ref: containerRef,
      })
  },
})
