import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  DragDrop as PreactDragDrop,
  type DragDropProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<DragDropProps>({
  name: 'DragDrop',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderDragDrop() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactDragDrop, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies DragDropProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderDragDrop()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderDragDrop()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
