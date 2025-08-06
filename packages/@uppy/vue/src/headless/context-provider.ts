import type { NonNullableUppyContext, UploadStatus } from '@uppy/components'
import { createUppyEventAdapter } from '@uppy/components'
import type Uppy from '@uppy/core'
import type { PropType } from 'vue'
import {
  defineComponent,
  inject,
  markRaw,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
} from 'vue'

export interface UppyContext {
  uppy: Uppy | undefined
  status: UploadStatus
  progress: number
}

export const UppyContextSymbol = Symbol('uppy')

export const UppyContextProvider = defineComponent({
  name: 'UppyContextProvider',
  props: {
    uppy: {
      type: Object as PropType<Uppy>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const status = ref<UploadStatus>('init')
    const progress = ref(0)

    const uppyContext = reactive<UppyContext>({
      uppy: markRaw(props.uppy),
      status: 'init',
      progress: 0,
    })

    // Provide the context immediately instead of in onMounted
    provide(UppyContextSymbol, uppyContext)

    let uppyEventAdapter: ReturnType<typeof createUppyEventAdapter> | undefined

    onMounted(() => {
      if (!props.uppy) {
        throw new Error(
          'UppyContextProvider: passing `uppy` as a prop is required',
        )
      }

      uppyEventAdapter = createUppyEventAdapter({
        uppy: props.uppy,
        onStatusChange: (newStatus: UploadStatus) => {
          status.value = newStatus
          uppyContext.status = newStatus
        },
        onProgressChange: (newProgress: number) => {
          progress.value = newProgress
          uppyContext.progress = newProgress
        },
      })
    })

    onBeforeUnmount(() => {
      uppyEventAdapter?.cleanup()
    })

    return () => slots.default?.()
  },
})

export default UppyContextProvider

export function injectUppyContext(): NonNullableUppyContext {
  const ctx = inject<UppyContext>(UppyContextSymbol)

  if (!ctx?.uppy) {
    throw new Error('Component must be called within a UppyContextProvider')
  }

  return ctx as NonNullableUppyContext // covered by the if-statement above
}
