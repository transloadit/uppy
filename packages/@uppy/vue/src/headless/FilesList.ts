import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  FilesList as PreactFilesList,
  type FilesListProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<FilesListProps>({
  name: 'FilesList',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderFilesList() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactFilesList, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies FilesListProps),
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
    )

    return () => h('div', { ref: containerRef })
  },
})
