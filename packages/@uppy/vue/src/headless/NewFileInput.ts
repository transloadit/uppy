import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  NewFileInput as PreactNewFileInput,
  type NewFileInputProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'

export default defineComponent<Omit<NewFileInputProps, 'ctx'>>({
  name: 'NewFileInput',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()

    function renderNewFileInput() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactNewFileInput, {
            ...props,
            ctx,
          } satisfies NewFileInputProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderNewFileInput()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderNewFileInput()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
