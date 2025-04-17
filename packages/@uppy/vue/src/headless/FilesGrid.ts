import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  FilesGrid as PreactFilesGrid,
  type FilesGridProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<FilesGridProps>({
  name: 'FilesGrid',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderFilesGrid() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactFilesGrid, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies FilesGridProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderFilesGrid()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderFilesGrid()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
