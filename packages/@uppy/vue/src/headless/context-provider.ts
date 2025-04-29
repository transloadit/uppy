import {
  defineComponent,
  provide,
  reactive,
  ref,
  onMounted,
  onBeforeUnmount,
} from 'vue'
import type { PropType } from 'vue'
import type Uppy from '@uppy/core'

export type UploadStatus =
  | 'init'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'error'
  | 'complete'

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
      uppy: props.uppy,
      status: 'init',
      progress: 0,
    })

    // Provide the context immediately instead of in onMounted
    provide(UppyContextSymbol, uppyContext)

    // Define event handlers first so they can be referenced in lifecycle hooks
    const onFileAdded = () => {
      console.log('onFileAdded')
      status.value = 'ready'
      uppyContext.status = 'ready'
    }
    const onProgress = (p: number) => {
      progress.value = p
      uppyContext.progress = p
    }
    const onUploadStarted = () => {
      status.value = 'uploading'
      uppyContext.status = 'uploading'
    }
    const onComplete = () => {
      status.value = 'complete'
      progress.value = 0
      uppyContext.status = 'complete'
      uppyContext.progress = 0
    }
    const onError = () => {
      status.value = 'error'
      progress.value = 0
      uppyContext.status = 'error'
      uppyContext.progress = 0
    }
    const onCancelAll = () => {
      status.value = 'init'
      progress.value = 0
      uppyContext.status = 'init'
      uppyContext.progress = 0
    }
    const onPauseAll = () => {
      status.value = 'paused'
      uppyContext.status = 'paused'
    }
    const onResumeAll = () => {
      status.value = 'uploading'
      uppyContext.status = 'uploading'
    }

    onMounted(() => {
      if (!props.uppy) {
        throw new Error(
          'UppyContextProvider: passing `uppy` as a prop is required',
        )
      }

      props.uppy.on('file-added', onFileAdded)
      props.uppy.on('progress', onProgress)
      props.uppy.on('upload', onUploadStarted)
      props.uppy.on('complete', onComplete)
      props.uppy.on('error', onError)
      props.uppy.on('cancel-all', onCancelAll)
      props.uppy.on('pause-all', onPauseAll)
      props.uppy.on('resume-all', onResumeAll)
    })

    onBeforeUnmount(() => {
      if (props.uppy) {
        props.uppy.off('file-added', onFileAdded)
        props.uppy.off('progress', onProgress)
        props.uppy.off('upload', onUploadStarted)
        props.uppy.off('complete', onComplete)
        props.uppy.off('error', onError)
        props.uppy.off('cancel-all', onCancelAll)
        props.uppy.off('pause-all', onPauseAll)
        props.uppy.off('resume-all', onResumeAll)
      }
    })

    return () => slots.default?.()
  },
})

export default UppyContextProvider
