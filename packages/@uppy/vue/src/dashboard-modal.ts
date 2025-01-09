import { defineComponent, ref, watch, h, type PropType } from 'vue'
import DashboardPlugin, { type DashboardOptions } from '@uppy/dashboard'
import { Uppy } from '@uppy/core'
import type { Meta, Body } from '@uppy/core'
import useUppy from './useUppy.js'

type DashboardModalOptions<M extends Meta, B extends Body> = Omit<
  DashboardOptions<M, B> & { inline: false },
  'inline'
>

export default defineComponent({
  name: 'DashboardModal',
  props: {
    uppy: {
      type: Uppy<any, any>,
      required: true,
    },
    props: {
      type: Object as PropType<DashboardModalOptions<any, any>>,
    },
    open: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const containerRef = ref<string>()
    const pluginRef = ref<DashboardPlugin<any, any>>()
    const propsRef = ref(props.props)
    const onMount = () => {
      const { uppy } = props
      const options = {
        id: 'DashboardModal',
        inline: false,
        ...props.props,
        target: containerRef.value,
      }
      uppy.use(DashboardPlugin, options)
      pluginRef.value = uppy.getPlugin(options.id) as DashboardPlugin<any, any>
    }

    useUppy(onMount, pluginRef, props.uppy, propsRef)

    watch(
      () => props.open,
      (current, old) => {
        if (current && !old) {
          pluginRef.value!.openModal()
        }
        if (!current && old) {
          pluginRef.value!.closeModal()
        }
      },
    )

    return () =>
      h('div', {
        ref: containerRef,
      })
  },
})
