import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  Dropzone as PreactDropzone,
  type DropzoneProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'

export default defineComponent<DropzoneProps>({
  name: 'Dropzone',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()

    function renderDropzone() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactDropzone, {
            ...props,
            ctx,
          } satisfies DropzoneProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderDropzone()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderDropzone()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
