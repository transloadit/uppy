import { defineComponent, ref, watch, onMounted, h } from 'vue'
import {
  UploadButton as PreactUploadButton,
  type UploadButtonProps,
} from '@uppy/components'
import { h as preactH } from 'preact'
import { render as preactRender } from 'preact/compat'
import { shallowEqualObjects } from 'shallow-equal'
import { useUppyContext } from './useUppyContext.js'
import { useVueRender } from './useVueRender.js'

export default defineComponent<UploadButtonProps>({
  name: 'UploadButton',
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    const ctx = useUppyContext()
    const vueRender = useVueRender()

    function renderUploadButton() {
      if (containerRef.value) {
        preactRender(
          preactH(PreactUploadButton, {
            ...props,
            ctx,
            render: vueRender,
          } satisfies UploadButtonProps),
          containerRef.value,
        )
      }
    }

    onMounted(() => {
      renderUploadButton()
    })

    watch(
      () => props,
      (current, old) => {
        if (!shallowEqualObjects(current, old)) {
          renderUploadButton()
        }
      },
    )

    return () => h('div', { ref: containerRef })
  },
})
