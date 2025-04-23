import {
  defineComponent,
  ref,
  watch,
  onMounted,
  h,
  type SetupContext,
} from 'vue'
import {
  FilesList as PreactFilesList,
  type FilesListProps as PreactFilesListProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<PreactFilesListProps>({
  name: 'FilesList',
  setup(props, { slots }: SetupContext) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderFilesList() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactFilesList, {
            ...props,
            item:
              slots.item ? (file: any) => slots.item?.({ file }) : undefined,
            ctx,
            render: vueRender,
          } satisfies PreactFilesListProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderFilesList()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderFilesList()
        }
      },
      { deep: false },
    )

    return () => h('div', { ref: containerRef })
  },
})
